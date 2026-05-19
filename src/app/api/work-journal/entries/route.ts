import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { activityContextsModule, workJournalModule } from "@/lib/container";
import { presentWorkJournalEntry } from "@/modules/work-journal";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import {
  parseCreateWorkJournalEntryRequest,
  parseListWorkJournalEntriesRequest,
} from "../validation";
import {
  toWorkJournalEntryResponse,
  type CreateWorkJournalEntryResponse,
  type ListWorkJournalEntriesResponse,
} from "./responses";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    workJournalModule.bindRequest(supabase);
    activityContextsModule.bindRequest(supabase);

    const parsed = parseListWorkJournalEntriesRequest(req.nextUrl.searchParams);
    if (!parsed.ok) return errorResponse(parsed.error);

    const [entries, contexts] = await Promise.all([
      workJournalModule.listEntries.execute(user.id, parsed.value),
      activityContextsModule.listActivityContexts.execute(user.id),
    ]);
    const contextsById = new Map(contexts.map((context) => [context.id, context]));
    return ok(
      entries.map((entry) =>
        toWorkJournalEntryResponse(
          presentWorkJournalEntry(entry, contextsById.get(entry.contextId))
        )
      ) satisfies ListWorkJournalEntriesResponse
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
    activityContextsModule.bindRequest(supabase);

    const entry = await workJournalModule.createEntry.execute({
      user_id: user.id,
      ...parsed.value,
    });

    const contexts = await activityContextsModule.listActivityContexts.execute(user.id);
    const context = contexts.find((item) => item.id === entry.contextId);
    return created(
      toWorkJournalEntryResponse(
        presentWorkJournalEntry(entry, context)
      ) satisfies CreateWorkJournalEntryResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
