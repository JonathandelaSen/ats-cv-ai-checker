import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { cvLibraryModule, jobMatchAnalysisModule } from "@/lib/container";
import {
  presentJobMatchAnalysis,
  presentJobMatchAnalysisSummary,
} from "@/modules/job-match-analysis";
import { parseCreateJobMatchAnalysisRequest } from "./validation";
import {
  toJobMatchAnalysisSummaryResponse,
  toJobMatchAnalysisDetailResponse,
} from "./responses";
import { ok, errorResponse, notFound, badRequest, handleApiError } from "@/modules/shared";

const ROUTE_SOURCE = "api_job_match_analyses";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const analyses = await jobMatchAnalysisModule
      .bindRequest(supabase)
      .listJobMatchAnalyses.execute({ userId: user.id });
    return ok(analyses.map((a) => toJobMatchAnalysisSummaryResponse(presentJobMatchAnalysisSummary(a))));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId("job_match_analysis");
  let userId: string | null = null;
  let cvIdForEvents: string | null = null;
  let analysisIdForEvents: string | null = null;

  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    userId = user.id;

    const body = await req.json();
    const parsed = parseCreateJobMatchAnalysisRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    const { cvId, title, jobDescription, jobUrl, model } = parsed.value;
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
      throw notFound("CV not found");
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
      throw badRequest("No extracted text available for this CV");
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
        mode: "job_match",
        model,
      },
    });

    const analysisLegacy = presentJobMatchAnalysis(
      await jobMatchAnalysisModule
        .bindRequest(supabase)
        .createJobMatchAnalysis.execute({
          id: analysisIdForEvents,
          userId: user.id,
          cvDocumentId: prepared.cv.id,
          title,
          filename: prepared.filename,
          fileSize: prepared.fileSize,
          pdfStoragePath: prepared.pdfStoragePath,
          extractedText: prepared.extractedText,
          aiModel: model,
          jobDescription,
          jobUrl,
        }),
    );
    const analysis = toJobMatchAnalysisDetailResponse(analysisLegacy);

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
        mode: "job_match",
        model,
        score: analysis.aiScore,
      },
    });

    return ok(analysis);
  } catch (error: unknown) {
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
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const boundJobMatchAnalysisModule =
      jobMatchAnalysisModule.bindRequest(supabase);
    const analyses = await boundJobMatchAnalysisModule.listJobMatchAnalyses.execute({
      userId: user.id,
    });
    await Promise.all(
      analyses.map((analysis) =>
        boundJobMatchAnalysisModule.deleteJobMatchAnalysis.execute({
          id: analysis.toPrimitives().id,
          userId: user.id,
        }),
      ),
    );
    return ok({ success: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
