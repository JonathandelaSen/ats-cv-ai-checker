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

    const body = (await req.json()) as Record<string, unknown>;
    const geminiApiKey =
      typeof body.geminiApiKey === "string" ? body.geminiApiKey.trim() : "";
    const model =
      typeof body.model === "string" && body.model.trim()
        ? body.model.trim()
        : "gemini-3.1-pro-preview";
    const additionalContext =
      typeof body.additionalContext === "string"
        ? body.additionalContext.trim() || null
        : null;

    if (!geminiApiKey) {
      return NextResponse.json(
        {
          error:
            "Configura tu API key de Gemini en Configuración antes de lanzar el análisis.",
        },
        { status: 400 },
      );
    }

    const updated = await cvAnalysisModule
      .bindRequest(supabase)
      .scoreCVAnalysis.execute({
        id: analysisId,
        userId: user.id,
        apiKey: geminiApiKey,
        model,
        additionalContext,
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
