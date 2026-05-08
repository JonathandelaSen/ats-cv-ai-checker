import { NextRequest, NextResponse } from "next/server";
import { generateOfferChatAnswer } from "@/lib/ai-offer-chat";
import { getBestCVText } from "@/lib/cv-profile";
import {
  createAnalysisChatMessage,
  getAnalysis,
  listAnalysisChatMessages,
} from "@/lib/db";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const analysis = await getAnalysis(supabase, id, user.id);
    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }
    if (analysis.analysis_mode !== "job_match") {
      return NextResponse.json(
        { error: "Only job match analyses can use offer chat" },
        { status: 400 }
      );
    }

    const messages = await listAnalysisChatMessages(supabase, user.id, id);
    return NextResponse.json({ messages });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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
    const message = normalizeRequiredText(body.message);
    const geminiApiKey = normalizeRequiredText(body.geminiApiKey);
    const model = normalizeRequiredText(body.model) ?? "gemini-3.1-pro-preview";

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Configura tu API key de Gemini antes de chatear con la IA." },
        { status: 400 }
      );
    }

    const analysis = await getAnalysis(supabase, id, user.id);
    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }
    if (analysis.analysis_mode !== "job_match") {
      return NextResponse.json(
        { error: "Only job match analyses can use offer chat" },
        { status: 400 }
      );
    }
    cvIdForEvents = analysis.cv_id;

    const history = await listAnalysisChatMessages(supabase, user.id, id);
    const userMessage = await createAnalysisChatMessage(supabase, {
      user_id: user.id,
      analysis_id: id,
      role: "user",
      content: message,
      model: null,
      metadata: { requestId },
    });

    await recordProcessingEvent({
      userId,
      cvId: analysis.cv_id,
      analysisId: id,
      requestId,
      stage: "offer_chat_generate",
      status: "started",
      source: "api_analysis_chat",
      textLength: message.length,
      metadata: {
        model,
        historyLength: history.length,
      },
    });

    const answer = await generateOfferChatAnswer({
      apiKey: geminiApiKey,
      model,
      message,
      analysis,
      cv: analysis.cv,
      cvText: getBestCVText(analysis),
      history,
    });

    const assistantMessage = await createAnalysisChatMessage(supabase, {
      user_id: user.id,
      analysis_id: id,
      role: "assistant",
      content: answer,
      model,
      metadata: { requestId },
    });

    await recordProcessingEvent({
      userId,
      cvId: analysis.cv_id,
      analysisId: id,
      requestId,
      stage: "offer_chat_generate",
      status: "success",
      source: "api_analysis_chat",
      durationMs: performance.now() - startedAt,
      textLength: answer.length,
      metadata: {
        model,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      },
    });

    return NextResponse.json({ userMessage, assistantMessage });
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
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
