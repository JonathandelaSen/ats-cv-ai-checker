import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { cvAnalysisModule, cvLibraryModule } from "@/lib/container";
import {
  presentCVAnalysis,
  presentCVAnalysisSummary,
} from "@/modules/cv-analysis";
import { parseCreateCVAnalysisRequest } from "./validation";

const ROUTE_SOURCE = "api_cv_analyses";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const analyses = await cvAnalysisModule
      .bindRequest(supabase)
      .listCVAnalyses.execute({ userId: user.id });
    return NextResponse.json(analyses.map(presentCVAnalysisSummary));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId("cv_analysis");
  let userId: string | null = null;
  let cvIdForEvents: string | null = null;
  let analysisIdForEvents: string | null = null;

  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    userId = user.id;

    const body = await req.json();
    const parsed = parseCreateCVAnalysisRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    const { cvId, title, context, model } = parsed.value;
    cvIdForEvents = cvId;

    const prepared = await cvLibraryModule
      .bindRequest(supabase)
      .prepareCVAnalysisInput.execute({
        userId: user.id,
        cvId,
        requestId,
        source: ROUTE_SOURCE,
      });
    if (!prepared) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    if (!prepared.analysisText) {
      await recordProcessingEvent({
        userId,
        cvId,
        requestId,
        stage: "analysis_preflight",
        status: "error",
        source: ROUTE_SOURCE,
        fileSize: prepared.extractionDiagnostics.fileSize,
        errorCode: "no_extracted_text_available",
        errorMessage: "No extracted text available for this CV.",
        metadata: prepared.extractionDiagnostics,
      });
      return NextResponse.json(
        { error: "No extracted text available for this CV" },
        { status: 400 },
      );
    }

    analysisIdForEvents = crypto.randomUUID();
    const persistStartedAt = performance.now();
    await recordProcessingEvent({
      userId,
      cvId,
      analysisId: analysisIdForEvents,
      requestId,
      stage: "analysis_persist",
      status: "started",
      source: ROUTE_SOURCE,
      metadata: {
        mode: "general",
        model,
      },
    });

    const analysis = presentCVAnalysis(
      await cvAnalysisModule
        .bindRequest(supabase)
        .createCVAnalysis.execute({
          id: analysisIdForEvents,
          userId: user.id,
          cvDocumentId: prepared.cv.id,
          title,
          filename: prepared.filename,
          fileSize: prepared.fileSize,
          pdfStoragePath: prepared.pdfStoragePath,
          extractedText: prepared.extractedText,
          aiModel: model,
          aiContext: context ?? null,
        }),
    );

    await recordProcessingEvent({
      userId,
      cvId,
      analysisId: analysis.id,
      requestId,
      stage: "analysis_persist",
      status: "success",
      source: ROUTE_SOURCE,
      durationMs: performance.now() - persistStartedAt,
      metadata: {
        mode: "general",
        model,
        score: analysis.ai_score,
      },
    });

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Create CV analysis error:", error);
    await recordProcessingEvent({
      userId,
      cvId: cvIdForEvents,
      analysisId: analysisIdForEvents,
      requestId,
      stage: "analysis_request",
      status: "error",
      source: ROUTE_SOURCE,
      errorCode: getErrorCode(error),
      errorMessage: sanitizeErrorMessage(error),
    });
    return NextResponse.json(
      { error: "Failed to create CV analysis", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const boundCVAnalysisModule = cvAnalysisModule.bindRequest(supabase);
    const analyses = await boundCVAnalysisModule.listCVAnalyses.execute({
      userId: user.id,
    });
    await Promise.all(
      analyses.map((analysis) =>
        boundCVAnalysisModule.deleteCVAnalysis.execute({
          id: analysis.toPrimitives().id,
          userId: user.id,
        }),
      ),
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
