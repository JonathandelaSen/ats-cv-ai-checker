import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import { presentWorkJournalEntry } from "@/modules/work-journal";
import { handleDomainError } from "@/modules/shared";
import { parseUpdateWorkJournalEntryRequest } from "../../validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = await req.json();
    const parsed = parseUpdateWorkJournalEntryRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    workJournalModule.bindRequest(supabase);
    const entry = await workJournalModule.updateEntry.execute(id, user.id, parsed.value);
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
