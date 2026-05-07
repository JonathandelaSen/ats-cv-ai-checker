import { NextRequest, NextResponse } from "next/server";
import {
  getInterviewQuestion,
  updateInterviewQuestion,
} from "@/lib/db";
import { generateInterviewQuestionAnswer } from "@/lib/ai-interview-question-generation";
import { getBestCVText } from "@/lib/cv-profile";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import {
  getAuthedSupabase,
  normalizeOptionalText,
  validateQuestionLinks,
} from "../../validation";

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
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    const { id } = await params;
    questionIdForEvents = id;
    const existing = await getInterviewQuestion(supabase, id, user.id);
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

    const body = (await req.json()) as Record<string, unknown>;
    const geminiApiKey = normalizeOptionalText(body.geminiApiKey);
    const model =
      normalizeOptionalText(body.model) ?? "gemini-3.1-pro-preview";
    const context = normalizeOptionalText(body.context) ?? existing.context;
    const cv_id =
      body.cv_id === undefined ? existing.cv_id : normalizeOptionalText(body.cv_id);
    const analysis_id =
      body.analysis_id === undefined
        ? existing.analysis_id
        : normalizeOptionalText(body.analysis_id);

    if (!geminiApiKey) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_generate",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "missing_gemini_api_key",
        errorMessage: "Gemini API key is required",
        metadata: { questionId: id, model },
      });
      return NextResponse.json(
        { error: "Configura tu API key de Gemini antes de generar respuestas." },
        { status: 400 }
      );
    }
    if (!context?.trim()) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_generate",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "context_required",
        errorMessage: "Context is required for AI generation",
        metadata: { questionId: id, model },
      });
      return NextResponse.json(
        { error: "Context is required for AI generation" },
        { status: 400 }
      );
    }
    if (cv_id === undefined || analysis_id === undefined) {
      return NextResponse.json({ error: "Invalid links" }, { status: 400 });
    }

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
    const answer = await generateInterviewQuestionAnswer({
      apiKey: geminiApiKey,
      model,
      question: existing.question,
      context,
      cv: links.cv,
      cvText,
      analysis: links.analysis,
    });
    cvIdForEvents = cv_id ?? links.analysis?.cv_id ?? null;
    analysisIdForEvents = analysis_id;

    const updated = await updateInterviewQuestion(supabase, id, user.id, {
      context,
      cv_id,
      analysis_id,
      answer,
      ai_model: model,
      ai_generated_at: new Date().toISOString(),
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
      textLength: answer.length,
      metadata: {
        questionId: id,
        model,
      },
    });

    return NextResponse.json(updated);
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
