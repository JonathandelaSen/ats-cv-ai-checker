import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { getBestCVText } from "@/lib/cv-profile";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import {
  parseGenerateInterviewQuestionRequest,
  validateQuestionLinks,
} from "../../validation";
import { selectionProcessModule } from "@/lib/container";
import { presentProcessQuestion } from "@/modules/selection-process";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = createRequestId("interview_question");
  const startedAt = performance.now();
  let userId: string | null = null;
  let cvIdForEvents: string | null = null;
  let analysisIdForEvents: string | null = null;
  let questionIdForEvents: string | null = null;
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    userId = user.id;

    const { id } = await params;
    questionIdForEvents = id;
    const existingReadModel = await selectionProcessModule
      .bindRequest(supabase)
      .getProcessQuestion.execute({ id, userId: user.id });
    const existing = existingReadModel
      ? presentProcessQuestion(existingReadModel)
      : null;
    if (!existing) {
      await recordProcessingEvent({
        userId,
        requestId,
        stage: "interview_question_generate",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "question_not_found",
        errorMessage: "Question not found",
        metadata: { questionId: id },
      });
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    cvIdForEvents = existing.cv_id;
    analysisIdForEvents = existing.analysis_id;

    const body = await req.json();
    const parsed = parseGenerateInterviewQuestionRequest(body, existing);
    if (!parsed.ok) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_generate",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode:
          parsed.error.message.includes("Gemini") ? "missing_gemini_api_key" :
          parsed.error.message.includes("Context") ? "context_required" : "invalid_links",
        errorMessage: parsed.error.message,
        metadata: { questionId: id },
      });
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    const { geminiApiKey, model, context, cv_id, analysis_id } = parsed.value;

    const links = await validateQuestionLinks(supabase, user.id, {
      cv_id,
      analysis_id,
    });
    if (!links.ok) {
      await recordProcessingEvent({
        userId,
        cvId: cv_id,
        analysisId: analysis_id,
        requestId,
        stage: "interview_question_generate",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "invalid_question_links",
        errorMessage: "Invalid linked CV or offer",
        metadata: { questionId: id, model },
      });
      return links.response;
    }
    if (links.analysis && links.analysis.analysis_mode !== "job_match") {
      return NextResponse.json(
        { error: "Only job match analyses can be linked as offers" },
        { status: 400 }
      );
    }

    const cvText = links.cv ? getBestCVText(links.cv) : null;
    cvIdForEvents = cv_id ?? links.analysis?.cv_id ?? null;
    analysisIdForEvents = analysis_id;

    const updated = await selectionProcessModule
      .bindRequest(supabase)
      .generateQuestionAnswer.execute({
      id,
      userId: user.id,
      apiKey: geminiApiKey,
      model,
      context,
      legacyCvId: cv_id,
      sourceJobMatchAnalysisId: analysis_id,
      cv: links.cv,
      cvText,
      analysis: links.analysis,
      requestId,
    });

    await recordProcessingEvent({
      userId,
      cvId: cvIdForEvents,
      analysisId: analysisIdForEvents,
      requestId,
      stage: "interview_question_generate",
      status: "success",
      source: "api_interview_questions",
      durationMs: performance.now() - startedAt,
      metadata: {
        questionId: id,
        model,
      },
    });

    return NextResponse.json(updated ? presentProcessQuestion(updated) : null);
  } catch (error: unknown) {
    await recordProcessingEvent({
      userId,
      cvId: cvIdForEvents,
      analysisId: analysisIdForEvents,
      requestId,
      stage: "interview_question_generate",
      status: "error",
      source: "api_interview_questions",
      durationMs: performance.now() - startedAt,
      errorCode: getErrorCode(error),
      errorMessage: sanitizeErrorMessage(error),
      metadata: {
        questionId: questionIdForEvents,
      },
    });
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
