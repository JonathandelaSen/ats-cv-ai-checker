import { NextRequest, NextResponse } from "next/server";
import {
  deleteWorkJournalHighlight,
  updateWorkJournalHighlight,
} from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeHighlightStatus,
  normalizeOptionalDate,
  normalizeRequiredDate,
  normalizeRequiredText,
  normalizeStringArray,
} from "../../validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const updates: Parameters<typeof updateWorkJournalHighlight>[3] = {};

    if (body.title !== undefined) {
      const title = normalizeRequiredText(body.title);
      if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
      updates.title = title;
    }
    if (body.summary !== undefined) {
      const summary = normalizeRequiredText(body.summary);
      if (!summary) return NextResponse.json({ error: "Summary is required" }, { status: 400 });
      updates.summary = summary;
    }
    if (body.date_start !== undefined) {
      updates.date_start = body.date_start ? normalizeRequiredDate(body.date_start) : null;
      if (body.date_start && !updates.date_start) {
        return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
      }
    }
    if (body.date_end !== undefined) {
      const date = normalizeOptionalDate(body.date_end);
      if (date === undefined) return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
      updates.date_end = date;
    }
    if (body.status !== undefined) {
      const status = normalizeHighlightStatus(body.status);
      if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      updates.status = status;
    }
    for (const key of [
      "source_entry_ids",
      "candidate_bullets",
      "detected_topics",
      "follow_up_questions",
      "additional_evidence",
    ] as const) {
      if (body[key] !== undefined) {
        const values = normalizeStringArray(body[key]);
        if (!values) return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
        updates[key] = values;
      }
    }

    const highlight = await updateWorkJournalHighlight(supabase, id, user.id, updates);
    if (!highlight) return NextResponse.json({ error: "Highlight not found" }, { status: 404 });
    return NextResponse.json(highlight);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const deleted = await deleteWorkJournalHighlight(supabase, id, user.id);
    if (!deleted) return NextResponse.json({ error: "Highlight not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

