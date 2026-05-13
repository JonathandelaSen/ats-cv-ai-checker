import { NextRequest, NextResponse } from "next/server";
import { workJournalModule } from "@/lib/container";
import { presentWorkJournalEntry } from "@/modules/work-journal";
import { handleDomainError } from "@/modules/shared";
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
    workJournalModule.bindRequest(supabase);

    const params = req.nextUrl.searchParams;
    const [entries, contexts] = await Promise.all([
      workJournalModule.listEntries.execute(user.id, {
        contextId: params.get("contextId"),
        search: params.get("q"),
        topic: params.get("topic"),
        dateFrom: params.get("dateFrom"),
        dateTo: params.get("dateTo"),
      }),
      workJournalModule.listContexts.execute(user.id),
    ]);
    const contextsById = new Map(contexts.map((context) => [context.id, context]));
    return NextResponse.json(
      entries.map((entry) => presentWorkJournalEntry(entry, contextsById.get(entry.contextId)))
    );
  } catch (error: unknown) {
    return handleDomainError(error);
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
    workJournalModule.bindRequest(supabase);

    const entry = await workJournalModule.createEntry.execute({
      user_id: user.id,
      context_id,
      date_start,
      date_end,
      topic,
      input_mode,
      raw_notes,
      final_text,
    });

    const contexts = await workJournalModule.listContexts.execute(user.id);
    const context = contexts.find((item) => item.id === entry.contextId);
    return NextResponse.json(presentWorkJournalEntry(entry, context), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
