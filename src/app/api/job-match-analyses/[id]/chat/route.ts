import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import {
  presentConversation,
  presentConversations,
  presentMessage,
  presentMessages,
} from "@/modules/analysis-chat";
import { analysisChatModule } from "@/lib/container";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { parseListOfferChatRequest, parseOfferChatPostRequest } from "./validation";
import { ok, errorResponse, notFound, badRequest, handleApiError } from "@/modules/shared";

export const maxDuration = 60;

async function validateJobMatch(analysisId: string, userId: string) {
  const context = await analysisChatModule.getAnalysisChatContext.execute({
    analysisId,
    userId,
  });
  if (!context) return { error: "Analysis not found", status: 404 as const };
  if (context.analysisMode !== "job_match") {
    return {
      error: "Only job match analyses can use offer chat",
      status: 400 as const,
    };
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    analysisChatModule.bindRequest(supabase);
    const validationError = await validateJobMatch(id, user.id);
    if (validationError) {
      if (validationError.status === 404) throw notFound(validationError.error);
      throw badRequest(validationError.error);
    }

    const parsed = parseListOfferChatRequest(req.nextUrl.searchParams);
    const { conversationId } = parsed.value;

    if (conversationId) {
      const messages = await analysisChatModule.listMessages.execute({
        userId: user.id,
        conversationId,
      });
      return ok({ messages: presentMessages(messages) });
    }

    const conversations = await analysisChatModule.listConversations.execute({
      userId: user.id,
      analysisId: id,
    });
    return ok({ conversations: presentConversations(conversations) });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = createRequestId("offer_chat");
  const startedAt = performance.now();
  let userId: string | null = null;
  let analysisIdForEvents: string | null = null;
  let cvIdForEvents: string | null = null;

  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    userId = user.id;

    const { id } = await params;
    analysisIdForEvents = id;
    const body = await req.json();
    const parsed = parseOfferChatPostRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }

    analysisChatModule.bindRequest(supabase);
    const validationError = await validateJobMatch(id, user.id);
    if (validationError) {
      if (validationError.status === 404) throw notFound(validationError.error);
      throw badRequest(validationError.error);
    }

    if (parsed.value.action === "create_conversation") {
      const conversation = await analysisChatModule.createConversation.execute({
        userId: user.id,
        analysisId: id,
        title: parsed.value.title,
        requestId,
      });
      return ok({ conversation: presentConversation(conversation) });
    }

    if (parsed.value.action === "rename_conversation") {
      const conversation = await analysisChatModule.renameConversation.execute({
        userId: user.id,
        analysisId: id,
        conversationId: parsed.value.conversationId,
        title: parsed.value.title,
        requestId,
      });
      return ok({ conversation: presentConversation(conversation) });
    }

    if (parsed.value.action === "delete_conversation") {
      await analysisChatModule.deleteConversation.execute({
        userId: user.id,
        analysisId: id,
        conversationId: parsed.value.conversationId,
        requestId,
      });
      return ok({ ok: true });
    }

    const context = await analysisChatModule.getAnalysisChatContext.execute({
      analysisId: id,
      userId: user.id,
    });
    cvIdForEvents = context?.cvId ?? null;

    const result = await analysisChatModule.sendMessage.execute({
      userId: user.id,
      analysisId: id,
      conversationId: parsed.value.conversationId,
      message: parsed.value.message,
      apiKey: parsed.value.geminiApiKey,
      model: parsed.value.model,
      requestId,
      startedAt,
    });

    return ok({
      userMessage: presentMessage(result.userMessage),
      assistantMessage: presentMessage(result.assistantMessage),
    });
  } catch (error: unknown) {
    await recordProcessingEvent({
      userId,
      cvId: cvIdForEvents,
      analysisId: analysisIdForEvents,
      requestId,
      stage: "offer_chat_generate",
      status: "error",
      source: "api_analysis_chat",
      durationMs: performance.now() - startedAt,
      errorCode: getErrorCode(error),
      errorMessage: sanitizeErrorMessage(error),
    });
    return handleApiError(error);
  }
}
