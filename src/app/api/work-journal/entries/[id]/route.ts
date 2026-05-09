import { NextRequest, NextResponse } from "next/server";
import {
  deleteWorkJournalEntry,
  getWorkJournalContext,
  updateWorkJournalEntry,
} from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeInputMode,
  normalizeOptionalDate,
  normalizeOptionalText,
  normalizeRequiredDate,
  normalizeRequiredText,
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
    const updates: Parameters<typeof updateWorkJournalEntry>[3] = {};

    if (body.context_id !== undefined) {
      const contextId = normalizeRequiredText(body.context_id);
      if (!contextId) return NextResponse.json({ error: "Context is required" }, { status: 400 });
      const context = await getWorkJournalContext(supabase, contextId, user.id);
      if (!context) return NextResponse.json({ error: "Context not found" }, { status: 404 });
      updates.context_id = contextId;
    }
    if (body.date_start !== undefined) {
      const date = normalizeRequiredDate(body.date_start);
      if (!date) return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
      updates.date_start = date;
    }
    if (body.date_end !== undefined) {
      const date = normalizeOptionalDate(body.date_end);
      if (date === undefined) return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
      updates.date_end = date;
    }
    if (body.topic !== undefined) {
      const topic = normalizeOptionalText(body.topic);
      if (topic === undefined) return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
      updates.topic = topic;
    }
    if (body.input_mode !== undefined) {
      const mode = normalizeInputMode(body.input_mode);
      if (!mode) return NextResponse.json({ error: "Invalid input mode" }, { status: 400 });
      updates.input_mode = mode;
    }
    if (body.raw_notes !== undefined) {
      const text = normalizeRequiredText(body.raw_notes);
      if (!text) return NextResponse.json({ error: "Raw notes are required" }, { status: 400 });
      updates.raw_notes = text;
    }
    if (body.final_text !== undefined) {
      const text = normalizeRequiredText(body.final_text);
      if (!text) return NextResponse.json({ error: "Final text is required" }, { status: 400 });
      updates.final_text = text;
    }

    const entry = await updateWorkJournalEntry(supabase, id, user.id, updates);
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    return NextResponse.json(entry);
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
    const deleted = await deleteWorkJournalEntry(supabase, id, user.id);
    if (!deleted) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

