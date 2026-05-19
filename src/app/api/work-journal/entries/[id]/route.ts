import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { activityContextsModule, workJournalModule } from "@/lib/container";
import { presentWorkJournalEntry } from "@/modules/work-journal";
import { ok, errorResponse, handleApiError } from "@/modules/shared";
import { parseUpdateWorkJournalEntryRequest } from "../../validation";
import {
  toWorkJournalEntryResponse,
  type DeleteWorkJournalEntryResponse,
  type UpdateWorkJournalEntryResponse,
} from "../responses";

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
      return errorResponse(parsed.error);
    }
    workJournalModule.bindRequest(supabase);
    activityContextsModule.bindRequest(supabase);
    const entry = await workJournalModule.updateEntry.execute(id, user.id, parsed.value);
    const contexts = await activityContextsModule.listActivityContexts.execute(user.id);
    const context = contexts.find((item) => item.id === entry.contextId);
    return ok(
      toWorkJournalEntryResponse(
        presentWorkJournalEntry(entry, context)
      ) satisfies UpdateWorkJournalEntryResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
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
    return ok({ ok: true } satisfies DeleteWorkJournalEntryResponse);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
