import {
  getCVTemplate,
  type CVTemplateId,
  type CVTemplateLocale,
} from "@/lib/cv-templates";
import { renderTemplatePDF } from "@/lib/cv-template-pdf";
import { getBestCVText } from "@/lib/cv-profile";
import { hasExtractedText, recordProcessingEvent, sanitizeErrorMessage } from "@/lib/observability";
import { extractPdfText } from "@/lib/pdf-extraction";
import { createClient } from "@/lib/supabase/server";
import { cvLibraryModule } from "@/lib/container";
import {
  CV_PDFS_BUCKET,
  presentCVDocument,
  type CVDocumentResponse,
} from "@/modules/cv-library";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function retryCVExtraction(input: {
  supabase: SupabaseServerClient;
  cv: CVDocumentResponse;
  userId: string;
  requestId: string;
}) {
  if (
    hasExtractedText([
      input.cv.text_python,
      input.cv.text_pdfjs,
      input.cv.text_node,
    ]) ||
    !input.cv.pdf_storage_path
  ) {
    return input.cv;
  }

  const { data, error } = await input.supabase.storage
    .from(CV_PDFS_BUCKET)
    .download(input.cv.pdf_storage_path);

  if (error) throw error;

  const extracted = await extractPdfText(Buffer.from(await data.arrayBuffer()), {
    userId: input.userId,
    cvId: input.cv.id,
    requestId: input.requestId,
    fileSize: input.cv.file_size,
    filename: input.cv.filename,
    pdfStoragePath: input.cv.pdf_storage_path,
  });

  const updated = await cvLibraryModule
    .bindRequest(input.supabase)
    .updateCVDocumentExtraction.execute({
      id: input.cv.id,
      userId: input.userId,
      requestId: input.requestId,
      extractedText: {
        textPython: extracted.text_python,
        textPdfjs: extracted.text_pdfjs,
        textNode: extracted.text_node,
        extractErrorPython: extracted.extract_error_python,
        extractErrorPdfjs: extracted.extract_error_pdfjs,
        extractErrorNode: extracted.extract_error_node,
      },
    });
  return updated ? presentCVDocument(updated) : input.cv;
}

function getTemplateAnalysisFilename(cv: CVDocumentResponse) {
  const baseName = cv.name.replace(/[^a-zA-Z0-9_-]/g, "_") || "template-cv";
  return `${baseName}.pdf`;
}

async function extractTemplateCVPdf(input: {
  supabase: SupabaseServerClient;
  cv: CVDocumentResponse;
  userId: string;
  requestId: string;
  source: string;
}) {
  if (!input.cv.profile || !input.cv.template_id) {
    throw new Error("Template CV has no profile or template.");
  }

  const template = getCVTemplate(input.cv.template_id);
  if (!template) {
    throw new Error("Template not found.");
  }

  const filename = getTemplateAnalysisFilename(input.cv);
  const renderStartedAt = performance.now();
  await recordProcessingEvent({
    userId: input.userId,
    cvId: input.cv.id,
    requestId: input.requestId,
    stage: "template_pdf_render",
    status: "started",
    source: input.source,
    metadata: {
      filename,
      templateId: template.templateId,
      locale: input.cv.template_locale,
    },
  });

  const templatePdfBuffer = await renderTemplatePDF({
    profile: input.cv.profile,
    templateId: template.templateId as CVTemplateId,
    locale: (input.cv.template_locale ?? "es") as CVTemplateLocale,
  });

  await recordProcessingEvent({
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
  await recordProcessingEvent({
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

  const { error: uploadError } = await input.supabase.storage
    .from(CV_PDFS_BUCKET)
    .upload(pdfStoragePath, templatePdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    await recordProcessingEvent({
      userId: input.userId,
      cvId: input.cv.id,
      requestId: input.requestId,
      stage: "storage_upload",
      status: "error",
      source: CV_PDFS_BUCKET,
      durationMs: performance.now() - storageStartedAt,
      fileSize: templatePdfBuffer.length,
      errorCode: "storage_upload_failed",
      errorMessage: sanitizeErrorMessage(uploadError.message),
      metadata: {
        storagePath: pdfStoragePath,
        temporary: true,
      },
    });
    throw uploadError;
  }

  await recordProcessingEvent({
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
    const extracted = await extractPdfText(templatePdfBuffer, {
      userId: input.userId,
      cvId: input.cv.id,
      requestId: input.requestId,
      fileSize: templatePdfBuffer.length,
      filename,
      pdfStoragePath,
    });

    return {
      extracted,
      filename,
      fileSize: templatePdfBuffer.length,
    };
  } finally {
    await input.supabase.storage
      .from(CV_PDFS_BUCKET)
      .remove([pdfStoragePath])
      .catch(() => {});
  }
}

export async function prepareAnalysisInput(input: {
  supabase: SupabaseServerClient;
  userId: string;
  cvId: string;
  requestId: string;
  source: string;
}) {
  const document = await cvLibraryModule
    .bindRequest(input.supabase)
    .getCVDocument.execute({ id: input.cvId, userId: input.userId });
  let cv = document ? presentCVDocument(document) : null;
  if (!cv) return null;

  cv = await retryCVExtraction({
    supabase: input.supabase,
    cv,
    userId: input.userId,
    requestId: input.requestId,
  });

  const templatePdfExtraction =
    cv.type === "template"
      ? await extractTemplateCVPdf({
          supabase: input.supabase,
          cv,
          userId: input.userId,
          requestId: input.requestId,
          source: input.source,
        })
      : null;
  const analysisExtraction = templatePdfExtraction?.extracted ?? {
    text_python: cv.text_python,
    text_pdfjs: cv.text_pdfjs,
    text_node: cv.text_node,
    extract_error_python: cv.extract_error_python,
    extract_error_pdfjs: cv.extract_error_pdfjs,
    extract_error_node: cv.extract_error_node,
  };
  const analysisText = getBestCVText(analysisExtraction);

  await recordProcessingEvent({
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
    fileSize: templatePdfExtraction?.fileSize ?? cv.file_size,
    textLength: analysisText?.trim().length ?? 0,
    errorCode: analysisText ? null : "no_extracted_text_available",
    errorMessage: analysisText
      ? null
      : "No parser produced usable text for this CV.",
    metadata: {
      cvType: cv.type,
      filename: templatePdfExtraction?.filename ?? cv.filename,
      pythonLength: analysisExtraction.text_python?.trim().length ?? 0,
      pdfjsLength: analysisExtraction.text_pdfjs?.trim().length ?? 0,
      nodeLength: analysisExtraction.text_node?.trim().length ?? 0,
      pythonError: Boolean(analysisExtraction.extract_error_python),
      pdfjsError: Boolean(analysisExtraction.extract_error_pdfjs),
      nodeError: Boolean(analysisExtraction.extract_error_node),
      templateId: cv.template_id,
    },
  });

  return {
    cv,
    analysisText,
    filename: templatePdfExtraction?.filename ?? cv.filename ?? "",
    fileSize: templatePdfExtraction?.fileSize ?? cv.file_size,
    extractedText: {
      textPython: analysisExtraction.text_python,
      textPdfjs: analysisExtraction.text_pdfjs,
      textNode: analysisExtraction.text_node,
      extractErrorPython: analysisExtraction.extract_error_python,
      extractErrorPdfjs: analysisExtraction.extract_error_pdfjs,
      extractErrorNode: analysisExtraction.extract_error_node,
    },
    extractionDiagnostics: {
      filename: templatePdfExtraction?.filename ?? cv.filename,
      fileSize: templatePdfExtraction?.fileSize ?? cv.file_size,
      pythonLength: analysisExtraction.text_python?.length ?? 0,
      pdfjsLength: analysisExtraction.text_pdfjs?.length ?? 0,
      nodeLength: analysisExtraction.text_node?.length ?? 0,
      pythonError: Boolean(analysisExtraction.extract_error_python),
      pdfjsError: Boolean(analysisExtraction.extract_error_pdfjs),
      nodeError: Boolean(analysisExtraction.extract_error_node),
    },
  };
}
