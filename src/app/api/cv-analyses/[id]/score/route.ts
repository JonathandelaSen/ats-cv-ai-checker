import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { cvAnalysisModule } from "@/lib/container";
import { presentCVAnalysis } from "@/modules/cv-analysis";
import { parseScoreCVAnalysisRequest } from "../../validation";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = createRequestId("cv_analysis_score");
  let userId: string | null = null;
  const { id: analysisId } = await params;

  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    userId = user.id;

    const body = await req.json();
    const parsed = parseScoreCVAnalysisRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }

    const updated = await cvAnalysisModule
      .bindRequest(supabase)
      .scoreCVAnalysis.execute({
        id: analysisId,
        userId: user.id,
        apiKey: parsed.value.geminiApiKey,
        model: parsed.value.model,
        additionalContext: parsed.value.additionalContext,
      });

    if (!updated) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(presentCVAnalysis(updated));
  } catch (error: unknown) {
    console.error("CV Analysis Score Error:", error);
    await recordProcessingEvent({
      userId,
      analysisId,
      requestId,
      stage: "cv_analysis_score",
      status: "error",
      source: "api_cv_analyses",
      errorCode: getErrorCode(error),
      errorMessage: sanitizeErrorMessage(error),
    });
    return NextResponse.json(
      { error: "Failed to score CV analysis", details: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
