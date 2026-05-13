import { NextRequest, NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import {
  getAuthedSupabase,
  normalizeOptionalLink,
  normalizeOptionalText,
  normalizeRequiredText,
  validateQuestionLinks,
} from "./validation";
import { selectionProcessModule } from "@/lib/container";
import { presentProcessQuestion, presentProcessQuestions } from "@/modules/selection-process";

function parseAnswered(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const questions = await selectionProcessModule
      .bindRequest(supabase)
      .listProcessQuestions.execute({
      userId: user.id,
      search: params.get("q"),
      cvId: params.get("cvId"),
      analysisId: params.get("analysisId"),
      answered: parseAnswered(params.get("answered")),
    });

    return NextResponse.json(presentProcessQuestions(questions));
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId("interview_question");
  const startedAt = performance.now();
  let userId: string | null = null;
  let cvIdForEvents: string | null = null;
  let analysisIdForEvents: string | null = null;
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    const data = (await req.json()) as Record<string, unknown>;
    cvIdForEvents =
      typeof data.cv_id === "string" && data.cv_id.trim() ? data.cv_id.trim() : null;
    analysisIdForEvents =
      typeof data.analysis_id === "string" && data.analysis_id.trim()
        ? data.analysis_id.trim()
        : null;
    await recordProcessingEvent({
      userId,
      cvId: cvIdForEvents,
      analysisId: analysisIdForEvents,
      requestId,
      stage: "interview_question_create",
      status: "started",
      source: "api_interview_questions",
      metadata: {
        hasQuestion: typeof data.question === "string" && Boolean(data.question.trim()),
        hasContext: typeof data.context === "string" && Boolean(data.context.trim()),
        hasAnswer: typeof data.answer === "string" && Boolean(data.answer.trim()),
      },
    });

    const question = normalizeRequiredText(data.question);
    if (!question) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_create",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "question_required",
        errorMessage: "Question is required",
      });
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const context =
      data.context === undefined ? null : normalizeOptionalText(data.context);
    const answer =
      data.answer === undefined ? null : normalizeOptionalText(data.answer);
    const cv_id = normalizeOptionalLink(data.cv_id);
    const analysis_id = normalizeOptionalLink(data.analysis_id);

    if (
      context === undefined ||
      answer === undefined ||
      cv_id === undefined ||
      analysis_id === undefined
    ) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_create",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "invalid_payload",
        errorMessage: "Invalid payload",
      });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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
        stage: "interview_question_create",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: "invalid_question_links",
        errorMessage: "Invalid linked CV or offer",
        metadata: {
          cvId: cv_id,
          analysisId: analysis_id,
        },
      });
      return links.response;
    }
    const linkedCvId = cv_id ?? links.analysis?.cv_id ?? null;
    cvIdForEvents = linkedCvId;

    const created = await selectionProcessModule
      .bindRequest(supabase)
      .createProcessQuestion.execute({
      userId: user.id,
      question,
      context,
      answer,
      legacyCvId: linkedCvId,
      sourceJobMatchAnalysisId: analysis_id,
      requestId,
    });
    const response = presentProcessQuestion(created);

    await recordProcessingEvent({
      userId,
      cvId: linkedCvId,
      analysisId: analysis_id,
      requestId,
      stage: "interview_question_create",
      status: "success",
      source: "api_interview_questions",
      durationMs: performance.now() - startedAt,
      metadata: {
        questionId: response.id,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    await recordProcessingEvent({
      userId,
      cvId: cvIdForEvents,
      analysisId: analysisIdForEvents,
      requestId,
      stage: "interview_question_create",
      status: "error",
      source: "api_interview_questions",
      durationMs: performance.now() - startedAt,
      errorCode: getErrorCode(error),
      errorMessage: sanitizeErrorMessage(error),
    });
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
