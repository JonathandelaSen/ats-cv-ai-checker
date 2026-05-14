import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import { presentWorkJournalEntry } from "@/modules/work-journal";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import {
  parseCreateWorkJournalEntryRequest,
  parseListWorkJournalEntriesRequest,
} from "../validation";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    workJournalModule.bindRequest(supabase);

    const parsed = parseListWorkJournalEntriesRequest(req.nextUrl.searchParams);
    if (!parsed.ok) return errorResponse(parsed.error);

    const [entries, contexts] = await Promise.all([
      workJournalModule.listEntries.execute(user.id, parsed.value),
      workJournalModule.listContexts.execute(user.id),
    ]);
    const contextsById = new Map(contexts.map((context) => [context.id, context]));
    return ok(
      entries.map((entry) => presentWorkJournalEntry(entry, contextsById.get(entry.contextId)))
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = await req.json();
    const parsed = parseCreateWorkJournalEntryRequest(body);
    if (!parsed.ok) return errorResponse(parsed.error);

    workJournalModule.bindRequest(supabase);

    const entry = await workJournalModule.createEntry.execute({
      user_id: user.id,
      ...parsed.value,
    });

    const contexts = await workJournalModule.listContexts.execute(user.id);
    const context = contexts.find((item) => item.id === entry.contextId);
    return created(presentWorkJournalEntry(entry, context));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
