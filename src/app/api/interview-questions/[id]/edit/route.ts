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
  normalizeOptionalText,
  normalizeRequiredText,
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
        stage: "interview_question_edit",
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
    const instruction = normalizeRequiredText(body.instruction);
    const context = normalizeOptionalText(body.context) ?? existing.context;

    if (!geminiApiKey) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_edit",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "missing_gemini_api_key",
        errorMessage: "Gemini API key is required",
        metadata: { questionId: id, model },
      });
      return NextResponse.json(
        { error: "Configura tu API key de Gemini antes de editar respuestas." },
        { status: 400 }
      );
    }
    if (!instruction) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_edit",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "instruction_required",
        errorMessage: "Instruction is required",
        metadata: { questionId: id, model },
      });
      return NextResponse.json(
        { error: "Instruction is required" },
        { status: 400 }
      );
    }
    if (!context?.trim()) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_edit",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "context_required",
        errorMessage: "Context is required for AI editing",
        metadata: { questionId: id, model },
      });
      return NextResponse.json(
        { error: "Context is required for AI editing" },
        { status: 400 }
      );
    }
    if (!existing.answer?.trim()) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_edit",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "answer_required",
        errorMessage: "There is no answer to edit",
        metadata: { questionId: id, model },
      });
      return NextResponse.json(
        { error: "There is no answer to edit" },
        { status: 400 }
      );
    }

    const links = await validateQuestionLinks(supabase, user.id, {
      cv_id: existing.cv_id,
      analysis_id: existing.analysis_id,
    });
    if (!links.ok) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_edit",
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

    const updated = await selectionProcessModule
      .bindRequest(supabase)
      .editQuestionAnswer.execute({
      id,
      userId: user.id,
      apiKey: geminiApiKey,
      model,
      context,
      instruction,
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
      stage: "interview_question_edit",
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
      stage: "interview_question_edit",
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
