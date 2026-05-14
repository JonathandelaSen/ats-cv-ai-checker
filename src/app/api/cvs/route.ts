import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  hasExtractedText,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { extractPdfText } from "@/lib/pdf-extraction";
import { cvLibraryModule } from "@/lib/container";
import { CV_PDFS_BUCKET, presentCVDocument, presentCVDocuments } from "@/modules/cv-library";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const cvs = await cvLibraryModule
      .bindRequest(supabase)
      .listCVDocuments.execute({ userId: user.id });
    return NextResponse.json(presentCVDocuments(cvs));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId("cv_upload");
  let userId: string | null = null;
  let cvId: string | null = null;
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    userId = user.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedName = String(formData.get("name") ?? "").trim();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Solo se permiten archivos PDF." },
        { status: 400 }
      );
    }

    cvId = crypto.randomUUID();
    await recordProcessingEvent({
      userId,
      cvId,
      requestId,
      stage: "cv_upload",
      status: "started",
      source: "api_cvs",
      fileSize: file.size,
      metadata: {
        filename: file.name,
        contentType: file.type,
      },
    });

    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const pdfStoragePath = `${user.id}/${cvId}-${safeFilename}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const storageStartedAt = performance.now();
    await recordProcessingEvent({
      userId,
      cvId,
      requestId,
      stage: "storage_upload",
      status: "started",
      source: CV_PDFS_BUCKET,
      fileSize: file.size,
      metadata: { storagePath: pdfStoragePath },
    });

    const { error: uploadError } = await supabase.storage
      .from(CV_PDFS_BUCKET)
      .upload(pdfStoragePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      await recordProcessingEvent({
        userId,
        cvId,
        requestId,
        stage: "storage_upload",
        status: "error",
        source: CV_PDFS_BUCKET,
        durationMs: performance.now() - storageStartedAt,
        fileSize: file.size,
        errorCode: "storage_upload_failed",
        errorMessage: sanitizeErrorMessage(uploadError.message),
      });
      throw uploadError;
    }

    await recordProcessingEvent({
      userId,
      cvId,
      requestId,
      stage: "storage_upload",
      status: "success",
      source: CV_PDFS_BUCKET,
      durationMs: performance.now() - storageStartedAt,
      fileSize: file.size,
    });

    const extracted = await extractPdfText(buffer, {
      userId,
      cvId,
      requestId,
      fileSize: file.size,
      filename: file.name,
      pdfStoragePath,
    });

    const extractedTexts = [
      extracted.text_python,
      extracted.text_pdfjs,
      extracted.text_node,
    ];

    if (!hasExtractedText(extractedTexts)) {
      await supabase.storage
        .from(CV_PDFS_BUCKET)
        .remove([pdfStoragePath])
        .catch(() => {});
      await recordProcessingEvent({
        userId,
        cvId,
        requestId,
        stage: "cv_upload",
        status: "warning",
        source: "api_cvs",
        fileSize: file.size,
        textLength: 0,
        errorCode: "no_extracted_text_available",
        errorMessage: "CV upload rejected because no parser produced usable text.",
        metadata: {
          filename: file.name,
          storagePath: pdfStoragePath,
        },
      });
      return NextResponse.json(
        {
          error:
            "No se ha podido extraer texto del PDF. Prueba con un PDF con texto seleccionable.",
          errors: {
            python: extracted.extract_error_python,
            pdfjs: extracted.extract_error_pdfjs,
            node: extracted.extract_error_node,
          },
        },
        { status: 400 }
      );
    }

    const cv = await cvLibraryModule
      .bindRequest(supabase)
      .createUploadedCVDocument.execute({
      id: cvId,
      userId: user.id,
      name: requestedName || file.name.replace(/\.pdf$/i, ""),
      filename: file.name,
      fileSize: file.size,
      pdfStoragePath,
      textPython: extracted.text_python,
      textPdfjs: extracted.text_pdfjs,
      textNode: extracted.text_node,
      extractErrorPython: extracted.extract_error_python,
      extractErrorPdfjs: extracted.extract_error_pdfjs,
      extractErrorNode: extracted.extract_error_node,
      requestId,
    });
    const responseCV = presentCVDocument(cv);

    const texts = [responseCV.text_python, responseCV.text_pdfjs, responseCV.text_node];
    await recordProcessingEvent({
      userId,
      cvId,
      requestId,
      stage: "cv_upload",
      status: hasExtractedText(texts) ? "success" : "warning",
      source: "api_cvs",
      fileSize: file.size,
      textLength: Math.max(
        responseCV.text_python?.length ?? 0,
        responseCV.text_pdfjs?.length ?? 0,
        responseCV.text_node?.length ?? 0
      ),
      errorCode: hasExtractedText(texts) ? null : "no_extracted_text_available",
      errorMessage: hasExtractedText(texts)
        ? null
        : "CV uploaded, but no parser produced usable text.",
      metadata: {
        filename: responseCV.filename,
      },
    });

    return NextResponse.json(responseCV);
  } catch (error: unknown) {
    console.error("Create CV error:", error);
    await recordProcessingEvent({
      userId,
      cvId,
      requestId,
      stage: "cv_upload",
      status: "error",
      source: "api_cvs",
      errorCode: getErrorCode(error),
      errorMessage: sanitizeErrorMessage(error),
    });
    return NextResponse.json(
      { error: "Internal server error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
