import { hasExtractedText, sanitizeErrorMessage } from "@/lib/observability";
import { getBestCVText, type StandardCVProfile } from "../../domain/cv-profile";
import {
  getCVTemplate,
  type CVTemplateId,
  type CVTemplateLocale,
} from "../../domain/cv-templates";
import { CV_PDFS_BUCKET } from "../../domain/services/cv-storage";
import type {
  CVDocument,
  CVDocumentExtractedTextPrimitives,
  CVDocumentPrimitives,
} from "../../domain/entities/cv-document.entity";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";
import type {
  CVPdfStorage,
  CVPdfTextExtractor,
  CVTemplatePdfRenderer,
} from "../../domain/repositories/cv-analysis-preparation-services";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";
import { Timestamp, UserId, type EventTracker } from "@/modules/shared";

export interface PrepareCVAnalysisInputInput {
  cvId: string;
  userId: string;
  requestId: string;
  source: string;
}

export interface PrepareCVAnalysisInputResult {
  cv: CVDocumentPrimitives;
  analysisText: string | null;
  filename: string;
  fileSize: number | null;
  pdfStoragePath: string | null;
  extractedText: CVDocumentExtractedTextPrimitives;
  extractionDiagnostics: {
    filename: string | null;
    fileSize: number | null;
    pythonLength: number;
    pdfjsLength: number;
    nodeLength: number;
    pythonError: boolean;
    pdfjsError: boolean;
    nodeError: boolean;
  };
}

type TemplateExtraction = {
  extracted: CVDocumentExtractedTextPrimitives;
  filename: string;
  fileSize: number;
};

export class PrepareCVAnalysisInputUseCase {
  constructor(
    private readonly deps: {
      documentRepo: CVDocumentRepository;
      pdfStorage: CVPdfStorage;
      textExtractor: CVPdfTextExtractor;
      templateRenderer: CVTemplatePdfRenderer;
      tracker: EventTracker;
    },
  ) {}

  async execute(
    input: PrepareCVAnalysisInputInput,
  ): Promise<PrepareCVAnalysisInputResult | null> {
    let cv = await this.deps.documentRepo.findById(
      CVDocumentId.fromPrimitives(input.cvId),
      UserId.fromPrimitives(input.userId),
    );
    if (!cv) return null;

    cv = await this.ensureUploadedCVExtraction({ ...input, cv });

    const cvPrimitives = cv.toPrimitives();
    const templatePdfExtraction =
      cvPrimitives.type === "template"
        ? await this.extractTemplateCVPdf({ ...input, cv: cvPrimitives })
        : null;
    const analysisExtraction =
      templatePdfExtraction?.extracted ?? cvPrimitives.extractedText;
    const analysisText = getBestCVText({
      text_python: analysisExtraction.textPython,
      text_pdfjs: analysisExtraction.textPdfjs,
      text_node: analysisExtraction.textNode,
    });

    await this.deps.tracker.record({
      userId: input.userId,
      cvId: input.cvId,
      requestId: input.requestId,
      stage: "cv_text_extraction",
      status: analysisText ? "success" : "warning",
      source: templatePdfExtraction
        ? "template_pdf_parse"
        : analysisText
          ? "stored_pdf_text"
          : "no_text_available",
      fileSize: templatePdfExtraction?.fileSize ?? cvPrimitives.fileSize,
      textLength: analysisText?.trim().length ?? 0,
      errorCode: analysisText ? null : "no_extracted_text_available",
      errorMessage: analysisText
        ? null
        : "No parser produced usable text for this CV.",
      metadata: {
        cvType: cvPrimitives.type,
        filename: templatePdfExtraction?.filename ?? cvPrimitives.filename,
        pythonLength: analysisExtraction.textPython?.trim().length ?? 0,
        pdfjsLength: analysisExtraction.textPdfjs?.trim().length ?? 0,
        nodeLength: analysisExtraction.textNode?.trim().length ?? 0,
        pythonError: Boolean(analysisExtraction.extractErrorPython),
        pdfjsError: Boolean(analysisExtraction.extractErrorPdfjs),
        nodeError: Boolean(analysisExtraction.extractErrorNode),
        templateId: cvPrimitives.templateId,
      },
    });

    return {
      cv: cvPrimitives,
      analysisText,
      filename: templatePdfExtraction?.filename ?? cvPrimitives.filename ?? "",
      fileSize: templatePdfExtraction?.fileSize ?? cvPrimitives.fileSize,
      pdfStoragePath: cvPrimitives.pdfStoragePath,
      extractedText: analysisExtraction,
      extractionDiagnostics: {
        filename: templatePdfExtraction?.filename ?? cvPrimitives.filename,
        fileSize: templatePdfExtraction?.fileSize ?? cvPrimitives.fileSize,
        pythonLength: analysisExtraction.textPython?.length ?? 0,
        pdfjsLength: analysisExtraction.textPdfjs?.length ?? 0,
        nodeLength: analysisExtraction.textNode?.length ?? 0,
        pythonError: Boolean(analysisExtraction.extractErrorPython),
        pdfjsError: Boolean(analysisExtraction.extractErrorPdfjs),
        nodeError: Boolean(analysisExtraction.extractErrorNode),
      },
    };
  }

  private async ensureUploadedCVExtraction(input: {
    cv: CVDocument;
    userId: string;
    requestId: string;
  }): Promise<CVDocument> {
    const primitives = input.cv.toPrimitives();
    if (
      hasExtractedText([
        primitives.extractedText.textPython,
        primitives.extractedText.textPdfjs,
        primitives.extractedText.textNode,
      ]) ||
      !primitives.pdfStoragePath
    ) {
      return input.cv;
    }

    const pdfBuffer = await this.deps.pdfStorage.download(
      primitives.pdfStoragePath,
    );
    const extracted = await this.deps.textExtractor.extract(pdfBuffer, {
      userId: input.userId,
      cvId: primitives.id,
      requestId: input.requestId,
      fileSize: primitives.fileSize,
      filename: primitives.filename,
      pdfStoragePath: primitives.pdfStoragePath,
    });

    input.cv.updateExtractedText(
      extracted,
      Timestamp.fromPrimitives(new Date().toISOString()),
    );
    const saved = await this.deps.documentRepo.save(input.cv);
    await this.deps.tracker.record({
      userId: input.userId,
      requestId: input.requestId,
      stage: "cv_library_extraction_updated",
      status: "success",
      source: "cv_library",
      cvId: saved.id,
    });
    return saved;
  }

  private getTemplateAnalysisFilename(cv: CVDocumentPrimitives) {
    const baseName = cv.name.replace(/[^a-zA-Z0-9_-]/g, "_") || "template-cv";
    return `${baseName}.pdf`;
  }

  private async extractTemplateCVPdf(input: {
    cv: CVDocumentPrimitives;
    userId: string;
    requestId: string;
    source: string;
  }): Promise<TemplateExtraction> {
    if (!input.cv.profile || !input.cv.templateId) {
      throw new Error("Template CV has no profile or template.");
    }

    const template = getCVTemplate(input.cv.templateId);
    if (!template) {
      throw new Error("Template not found.");
    }

    const filename = this.getTemplateAnalysisFilename(input.cv);
    const renderStartedAt = performance.now();
    await this.deps.tracker.record({
      userId: input.userId,
      cvId: input.cv.id,
      requestId: input.requestId,
      stage: "template_pdf_render",
      status: "started",
      source: input.source,
      metadata: {
        filename,
        templateId: template.templateId,
        locale: input.cv.templateLocale,
      },
    });

    const templatePdfBuffer = await this.deps.templateRenderer.render({
      profile: input.cv.profile as StandardCVProfile,
      templateId: template.templateId as CVTemplateId,
      locale: (input.cv.templateLocale ?? "es") as CVTemplateLocale,
    });

    await this.deps.tracker.record({
      userId: input.userId,
      cvId: input.cv.id,
      requestId: input.requestId,
      stage: "template_pdf_render",
      status: "success",
      source: input.source,
      durationMs: performance.now() - renderStartedAt,
      fileSize: templatePdfBuffer.length,
      metadata: {
        filename,
        templateId: template.templateId,
      },
    });

    const pdfStoragePath = `${input.userId}/${input.cv.id}-${input.requestId}-template.pdf`;
    const storageStartedAt = performance.now();
    await this.deps.tracker.record({
      userId: input.userId,
      cvId: input.cv.id,
      requestId: input.requestId,
      stage: "storage_upload",
      status: "started",
      source: CV_PDFS_BUCKET,
      fileSize: templatePdfBuffer.length,
      metadata: {
        storagePath: pdfStoragePath,
        temporary: true,
      },
    });

    try {
      await this.deps.pdfStorage.upload({
        path: pdfStoragePath,
        buffer: templatePdfBuffer,
        contentType: "application/pdf",
        upsert: true,
      });
    } catch (error: unknown) {
      await this.deps.tracker.record({
        userId: input.userId,
        cvId: input.cv.id,
        requestId: input.requestId,
        stage: "storage_upload",
        status: "error",
        source: CV_PDFS_BUCKET,
        durationMs: performance.now() - storageStartedAt,
        fileSize: templatePdfBuffer.length,
        errorCode: "storage_upload_failed",
        errorMessage: sanitizeErrorMessage(error),
        metadata: {
          storagePath: pdfStoragePath,
          temporary: true,
        },
      });
      throw error;
    }

    await this.deps.tracker.record({
      userId: input.userId,
      cvId: input.cv.id,
      requestId: input.requestId,
      stage: "storage_upload",
      status: "success",
      source: CV_PDFS_BUCKET,
      durationMs: performance.now() - storageStartedAt,
      fileSize: templatePdfBuffer.length,
      metadata: {
        storagePath: pdfStoragePath,
        temporary: true,
      },
    });

    try {
      const extracted = await this.deps.textExtractor.extract(
        templatePdfBuffer,
        {
          userId: input.userId,
          cvId: input.cv.id,
          requestId: input.requestId,
          fileSize: templatePdfBuffer.length,
          filename,
          pdfStoragePath,
        },
      );

      return {
        extracted,
        filename,
        fileSize: templatePdfBuffer.length,
      };
    } finally {
      await this.deps.pdfStorage.remove([pdfStoragePath]).catch(() => {});
    }
  }
}
