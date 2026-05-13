import { NextRequest, NextResponse } from "next/server";
import {
  presentConversation,
  presentConversations,
  presentMessage,
  presentMessages,
} from "@/modules/analysis-chat";
import { analysisChatModule } from "@/lib/container";
import { getErrorMessage } from "@/lib/errors";
import {
  createRequestId,
  getErrorCode,
  recordProcessingEvent,
  sanitizeErrorMessage,
} from "@/lib/observability";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

async function getAuthedSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

function normalizeRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function validateJobMatch(analysisId: string, userId: string) {
  const context = await analysisChatModule.getLegacyAnalysisChatContext.execute({
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
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    analysisChatModule.bindRequest(supabase);
    const validationError = await validateJobMatch(id, user.id);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.error },
        { status: validationError.status }
      );
    }

    const conversationId = req.nextUrl.searchParams.get("conversationId");

    if (conversationId) {
      const messages = await analysisChatModule.listMessages.execute({
        userId: user.id,
        conversationId,
      });
      return NextResponse.json({ messages: presentMessages(messages) });
    }

    const conversations = await analysisChatModule.listConversations.execute({
      userId: user.id,
      analysisId: id,
    });
    return NextResponse.json({ conversations: presentConversations(conversations) });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
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
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    const { id } = await params;
    analysisIdForEvents = id;
    const body = (await req.json()) as Record<string, unknown>;

    const action = typeof body.action === "string" ? body.action : "message";

    analysisChatModule.bindRequest(supabase);
    const validationError = await validateJobMatch(id, user.id);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.error },
        { status: validationError.status }
      );
    }

    if (action === "create_conversation") {
      const title = normalizeRequiredText(body.title) ?? "Nueva conversación";
      const conversation = await analysisChatModule.createConversation.execute({
        userId: user.id,
        analysisId: id,
        title,
        requestId,
      });
      return NextResponse.json({ conversation: presentConversation(conversation) });
    }

    if (action === "rename_conversation") {
      const conversationId = normalizeRequiredText(body.conversationId);
      const title = normalizeRequiredText(body.title);
      if (!conversationId || !title) {
        return NextResponse.json(
          { error: "conversationId and title are required" },
          { status: 400 }
        );
      }
      const conversation = await analysisChatModule.renameConversation.execute({
        userId: user.id,
        analysisId: id,
        conversationId,
        title,
        requestId,
      });
      return NextResponse.json({ conversation: presentConversation(conversation) });
    }

    if (action === "delete_conversation") {
      const conversationId = normalizeRequiredText(body.conversationId);
      if (!conversationId) {
        return NextResponse.json(
          { error: "conversationId is required" },
          { status: 400 }
        );
      }
      await analysisChatModule.deleteConversation.execute({
        userId: user.id,
        analysisId: id,
        conversationId,
        requestId,
      });
      return NextResponse.json({ ok: true });
    }

    const message = normalizeRequiredText(body.message);
    const geminiApiKey = normalizeRequiredText(body.geminiApiKey);
    const model =
      normalizeRequiredText(body.model) ?? "gemini-3.1-pro-preview";
    const conversationId = normalizeRequiredText(body.conversationId);

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }
    if (!geminiApiKey) {
      return NextResponse.json(
        {
          error:
            "Configura tu API key de Gemini antes de chatear con la IA.",
        },
        { status: 400 }
      );
    }
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const context = await analysisChatModule.getLegacyAnalysisChatContext.execute({
      analysisId: id,
      userId: user.id,
    });
    cvIdForEvents = context?.cvId ?? null;

    const result = await analysisChatModule.sendMessage.execute({
      userId: user.id,
      analysisId: id,
      conversationId,
      message,
      apiKey: geminiApiKey,
      model,
      requestId,
      startedAt,
    });

    return NextResponse.json({
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
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
