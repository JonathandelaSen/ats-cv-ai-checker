import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { jobMatchAnalysisModule } from "@/lib/container";
import { presentJobMatchAnalysis } from "@/modules/job-match-analysis";

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

    const body = (await req.json()) as Record<string, unknown>;
    const geminiApiKey =
      typeof body.geminiApiKey === "string" ? body.geminiApiKey.trim() : "";
    const model =
      typeof body.model === "string" && body.model.trim()
        ? body.model.trim()
        : "gemini-3.1-pro-preview";
    const jobDescription =
      typeof body.jobDescription === "string"
        ? body.jobDescription.trim()
        : "";
    const jobUrl =
      typeof body.jobUrl === "string" ? body.jobUrl.trim() || null : null;

    if (!geminiApiKey) {
      return NextResponse.json(
        {
          error:
            "Configura tu API key de Gemini en Configuración antes de lanzar el análisis.",
        },
        { status: 400 },
      );
    }
    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required for job match analysis" },
        { status: 400 },
      );
    }

    const updated = await jobMatchAnalysisModule
      .bindRequest(supabase)
      .scoreJobMatchAnalysis.execute({
        id: analysisId,
        userId: user.id,
        apiKey: geminiApiKey,
        model,
        jobDescription,
        jobUrl,
      });

    if (!updated) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(presentJobMatchAnalysis(updated));
  } catch (error: unknown) {
    console.error("Job Match Analysis Score Error:", error);
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
    return NextResponse.json(
      {
        error: "Failed to score job match analysis",
        details: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
