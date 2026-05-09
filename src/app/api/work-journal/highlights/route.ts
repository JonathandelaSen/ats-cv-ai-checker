import { NextRequest, NextResponse } from "next/server";
import {
  createWorkJournalHighlight,
  getWorkJournalContext,
  listWorkJournalHighlights,
} from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeHighlightStatus,
  normalizeOptionalDate,
  normalizeRequiredDate,
  normalizeRequiredText,
  normalizeStringArray,
} from "../validation";

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = req.nextUrl.searchParams;
    const statusParam = params.get("status");
    const highlights = await listWorkJournalHighlights(supabase, user.id, {
      contextId: params.get("contextId"),
      status:
        statusParam === "all" ? "all" : normalizeHighlightStatus(statusParam),
    });
    return NextResponse.json(highlights);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as Record<string, unknown>;
    const context_id = normalizeRequiredText(body.context_id);
    const title = normalizeRequiredText(body.title);
    const summary = normalizeRequiredText(body.summary);
    const date_start = body.date_start ? normalizeRequiredDate(body.date_start) : null;
    const date_end = normalizeOptionalDate(body.date_end);
    const status = normalizeHighlightStatus(body.status) ?? "saved";
    const source_entry_ids = normalizeStringArray(body.source_entry_ids) ?? [];
    const candidate_bullets = normalizeStringArray(body.candidate_bullets) ?? [];
    const detected_topics = normalizeStringArray(body.detected_topics) ?? [];
    const follow_up_questions = normalizeStringArray(body.follow_up_questions) ?? [];
    const additional_evidence = normalizeStringArray(body.additional_evidence) ?? [];

    if (!context_id || !title || !summary || date_end === undefined) {
      return NextResponse.json({ error: "Invalid highlight payload" }, { status: 400 });
    }
    const context = await getWorkJournalContext(supabase, context_id, user.id);
    if (!context) return NextResponse.json({ error: "Context not found" }, { status: 404 });

    const highlight = await createWorkJournalHighlight(supabase, {
      user_id: user.id,
      context_id,
      title,
      summary,
      date_start,
      date_end,
      status,
      source_entry_ids,
      candidate_bullets,
      detected_topics,
      follow_up_questions,
      additional_evidence,
      ai_model: null,
      ai_generated_at: null,
    });

    return NextResponse.json(highlight, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

