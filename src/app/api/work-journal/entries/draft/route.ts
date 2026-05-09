import { NextRequest, NextResponse } from "next/server";
import { getWorkJournalContext } from "@/lib/db";
import { draftWorkJournalEntry } from "@/lib/ai-work-journal";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeOptionalDate,
  normalizeOptionalText,
  normalizeRequiredDate,
  normalizeRequiredText,
} from "../../validation";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const geminiApiKey = normalizeRequiredText(body.geminiApiKey);
    const model = normalizeRequiredText(body.model) ?? "gemini-3.1-pro-preview";
    const contextId = normalizeRequiredText(body.context_id);
    const dateStart = normalizeRequiredDate(body.date_start);
    const dateEnd = normalizeOptionalDate(body.date_end);
    const topic = normalizeOptionalText(body.topic);
    const notes = normalizeRequiredText(body.notes);

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Configura tu API key de Gemini antes de redactar con IA." },
        { status: 400 }
      );
    }
    if (!contextId || !dateStart || dateEnd === undefined || topic === undefined || !notes) {
      return NextResponse.json({ error: "Invalid draft payload" }, { status: 400 });
    }

    const context = await getWorkJournalContext(supabase, contextId, user.id);
    if (!context) return NextResponse.json({ error: "Context not found" }, { status: 404 });

    const finalText = await draftWorkJournalEntry({
      apiKey: geminiApiKey,
      model,
      context,
      dateStart,
      dateEnd,
      topic,
      notes,
    });

    return NextResponse.json({ final_text: finalText });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

