import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import { presentWorkJournalEntry } from "@/modules/work-journal";
import { handleDomainError } from "@/modules/shared";
import {
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
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if (body.context_id !== undefined) {
      const contextId = normalizeRequiredText(body.context_id);
      if (!contextId) return NextResponse.json({ error: "Context is required" }, { status: 400 });
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
    workJournalModule.bindRequest(supabase);
    const entry = await workJournalModule.updateEntry.execute(id, user.id, updates);
    const contexts = await workJournalModule.listContexts.execute(user.id);
    const context = contexts.find((item) => item.id === entry.contextId);
    return NextResponse.json(presentWorkJournalEntry(entry, context));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    workJournalModule.bindRequest(supabase);
    await workJournalModule.deleteEntry.execute(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
