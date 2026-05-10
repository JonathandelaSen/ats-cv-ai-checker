import { NextRequest, NextResponse } from "next/server";
import {
  createWorkJournalEntry,
  getWorkJournalContext,
  listWorkJournalEntries,
  updateWorkJournalContext,
} from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";
import {
  getAuthedSupabase,
  normalizeInputMode,
  normalizeOptionalDate,
  normalizeOptionalText,
  normalizeRequiredDate,
  normalizeRequiredText,
} from "../validation";

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = req.nextUrl.searchParams;
    const entries = await listWorkJournalEntries(supabase, user.id, {
      contextId: params.get("contextId"),
      search: params.get("q"),
      topic: params.get("topic"),
      dateFrom: params.get("dateFrom"),
      dateTo: params.get("dateTo"),
    });
    return NextResponse.json(entries);
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
    const date_start = normalizeRequiredDate(body.date_start);
    const date_end = normalizeOptionalDate(body.date_end);
    const topic = normalizeOptionalText(body.topic);
    const input_mode = normalizeInputMode(body.input_mode) ?? "manual";
    const raw_notes = normalizeRequiredText(body.raw_notes);
    const final_text = normalizeRequiredText(body.final_text);

    if (!context_id || !date_start || date_end === undefined || topic === undefined || !raw_notes || !final_text) {
      return NextResponse.json({ error: "Invalid entry payload" }, { status: 400 });
    }

    const context = await getWorkJournalContext(supabase, context_id, user.id);
    if (!context || context.status !== "active") {
      return NextResponse.json({ error: "Context not found" }, { status: 404 });
    }
    await updateWorkJournalContext(supabase, context_id, user.id, {
      is_default: true,
    });

    const entry = await createWorkJournalEntry(supabase, {
      user_id: user.id,
      context_id,
      date_start,
      date_end,
      topic,
      input_mode,
      raw_notes,
      final_text,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
