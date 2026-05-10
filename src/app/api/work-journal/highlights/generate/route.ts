import { NextRequest, NextResponse } from "next/server";
import {
  createWorkJournalHighlight,
  getWorkJournalContext,
  listWorkJournalEntries,
  listWorkJournalHighlights,
  updateWorkJournalContext,
  updateWorkJournalHighlight,
} from "@/lib/db";
import { generateWorkJournalHighlights } from "@/lib/ai-work-journal";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeOptionalDate,
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
    const dateFrom = body.date_from ? normalizeRequiredDate(body.date_from) : null;
    const dateTo = normalizeOptionalDate(body.date_to);

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Configura tu API key de Gemini antes de generar highlights." },
        { status: 400 }
      );
    }
    if (!contextId || dateTo === undefined) {
      return NextResponse.json({ error: "Invalid highlight generation payload" }, { status: 400 });
    }

    const context = await getWorkJournalContext(supabase, contextId, user.id);
    if (!context) return NextResponse.json({ error: "Context not found" }, { status: 404 });
    await updateWorkJournalContext(supabase, contextId, user.id, {
      is_default: true,
    });

    const [entries, existingHighlights] = await Promise.all([
      listWorkJournalEntries(supabase, user.id, {
        contextId,
        dateFrom,
        dateTo,
      }),
      listWorkJournalHighlights(supabase, user.id, {
        contextId,
        status: "all",
      }),
    ]);

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No hay entradas en este contexto y rango." },
        { status: 400 }
      );
    }

    const generated = await generateWorkJournalHighlights({
      apiKey: geminiApiKey,
      model,
      context,
      entries,
      existingHighlights,
      dateFrom,
      dateTo,
    });

    const created = [];
    const merged = [];
    for (const item of generated) {
      const mergeTarget = item.merge_with_highlight_id
        ? existingHighlights.find((highlight) => highlight.id === item.merge_with_highlight_id)
        : null;

      if (mergeTarget) {
        const updated = await updateWorkJournalHighlight(
          supabase,
          mergeTarget.id,
          user.id,
          {
            source_entry_ids: Array.from(
              new Set([...mergeTarget.source_entry_ids, ...item.source_entry_ids])
            ),
            additional_evidence: [
              ...mergeTarget.additional_evidence,
              `AI suggested adding evidence: ${item.summary}`,
            ],
            follow_up_questions: Array.from(
              new Set([...mergeTarget.follow_up_questions, ...item.follow_up_questions])
            ),
            ai_model: model,
            ai_generated_at: new Date().toISOString(),
          }
        );
        if (updated) merged.push(updated);
        continue;
      }

      const highlight = await createWorkJournalHighlight(supabase, {
        user_id: user.id,
        context_id: contextId,
        title: item.title,
        summary: item.summary,
        date_start: item.date_start,
        date_end: item.date_end,
        status: "proposed",
        source_entry_ids: item.source_entry_ids,
        candidate_bullets: item.candidate_bullets,
        detected_topics: item.detected_topics,
        follow_up_questions: item.follow_up_questions,
        additional_evidence: [],
        ai_model: model,
        ai_generated_at: new Date().toISOString(),
      });
      created.push(highlight);
    }

    return NextResponse.json({ created, merged });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
