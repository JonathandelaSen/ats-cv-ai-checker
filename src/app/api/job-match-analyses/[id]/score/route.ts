import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { jobMatchAnalysisModule } from "@/lib/container";
import { presentJobMatchAnalysis } from "@/modules/job-match-analysis";
import { parseScoreJobMatchAnalysisRequest } from "../../validation";
import { ok, errorResponse, notFound, handleApiError } from "@/modules/shared";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = createRequestId("job_match_analysis_score");
  let userId: string | null = null;
  const { id: analysisId } = await params;

  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    userId = user.id;

    const body = await req.json();
    const parsed = parseScoreJobMatchAnalysisRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }

    const updated = await jobMatchAnalysisModule
      .bindRequest(supabase)
      .scoreJobMatchAnalysis.execute({
        id: analysisId,
        userId: user.id,
        apiKey: parsed.value.geminiApiKey,
        model: parsed.value.model,
        jobDescription: parsed.value.jobDescription,
        jobUrl: parsed.value.jobUrl,
      });

    if (!updated) {
      throw notFound("Analysis not found");
    }

    return ok(presentJobMatchAnalysis(updated));
  } catch (error: unknown) {
    await recordProcessingEvent({
      userId,
      analysisId,
      requestId,
      stage: "job_match_analysis_score",
      status: "error",
      source: "api_job_match_analyses",
      errorCode: getErrorCode(error),
      errorMessage: sanitizeErrorMessage(error),
    });
    return handleApiError(error);
  }
}
