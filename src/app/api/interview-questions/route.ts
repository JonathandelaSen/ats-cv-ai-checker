import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import {
  parseCreateInterviewQuestionRequest,
  parseListInterviewQuestionsRequest,
  validateQuestionLinks,
} from "./validation";
import { selectionProcessModule } from "@/lib/container";
import { presentProcessQuestion, presentProcessQuestions } from "@/modules/selection-process";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import {
  toInterviewQuestionResponse,
  toInterviewQuestionResponses,
  type ListInterviewQuestionsResponse,
  type SaveInterviewQuestionResponse,
} from "./responses";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const parsed = parseListInterviewQuestionsRequest(req.nextUrl.searchParams);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    const questions = await selectionProcessModule
      .bindRequest(supabase)
      .listProcessQuestions.execute({
      userId: user.id,
      ...parsed.value,
    });

    return ok(
      toInterviewQuestionResponses(
        presentProcessQuestions(questions)
      ) satisfies ListInterviewQuestionsResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const requestId = createRequestId("interview_question");
  const startedAt = performance.now();
  let userId: string | null = null;
  let cvIdForEvents: string | null = null;
  let analysisIdForEvents: string | null = null;
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    userId = user.id;

    const data = await req.json();
    const dataRecord = typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
    cvIdForEvents =
      typeof dataRecord.cv_id === "string" && dataRecord.cv_id.trim() ? dataRecord.cv_id.trim() : null;
    analysisIdForEvents =
      typeof dataRecord.analysis_id === "string" && dataRecord.analysis_id.trim()
        ? dataRecord.analysis_id.trim()
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
        hasQuestion: typeof dataRecord.question === "string" && Boolean(dataRecord.question.trim()),
        hasContext: typeof dataRecord.context === "string" && Boolean(dataRecord.context.trim()),
        hasAnswer: typeof dataRecord.answer === "string" && Boolean(dataRecord.answer.trim()),
      },
    });

    const parsed = parseCreateInterviewQuestionRequest(data);
    if (!parsed.ok) {
      await recordProcessingEvent({
        userId,
        cvId: cvIdForEvents,
        analysisId: analysisIdForEvents,
        requestId,
        stage: "interview_question_create",
        status: "warning",
        source: "api_interview_questions",
        durationMs: performance.now() - startedAt,
        errorCode: parsed.error.message === "Question is required" ? "question_required" : "invalid_payload",
        errorMessage: parsed.error.message,
      });
      return errorResponse(parsed.error);
    }
    const { question, context, answer, cv_id, analysis_id } = parsed.value;

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

    const createdQuestion = await selectionProcessModule
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
    const response = presentProcessQuestion(createdQuestion);

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

    return created(
      toInterviewQuestionResponse(response) satisfies SaveInterviewQuestionResponse
    );
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
    return handleApiError(error);
  }
}
