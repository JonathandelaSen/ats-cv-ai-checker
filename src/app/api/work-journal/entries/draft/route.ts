import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { activityContextsModule, workJournalModule } from "@/lib/container";
import { ok, errorResponse, handleApiError } from "@/modules/shared";
import { parseDraftWorkJournalEntryRequest } from "../../validation";
import type { DraftWorkJournalEntryResponse } from "./responses";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = await req.json();
    const parsed = parseDraftWorkJournalEntryRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    workJournalModule.bindRequest(supabase);
    activityContextsModule.bindRequest(supabase);
    const contexts = await activityContextsModule.listActivityContexts.execute(user.id);
    const context = contexts.find((item) => item.id === parsed.value.contextId);
    const finalText = await workJournalModule.draftEntry.execute(user.id, parsed.value.contextId, {
      provider: parsed.value.provider,
      apiKey: parsed.value.apiKey,
      model: parsed.value.model,
      context: {
        type: context?.toPrimitives().type ?? "other",
        name: context?.toPrimitives().name ?? "Selected activity context",
        roleOrLabel: null,
      },
      dateStart: parsed.value.dateStart,
      dateEnd: parsed.value.dateEnd,
      topic: parsed.value.topic,
      notes: parsed.value.notes,
    });

    return ok({ finalText } satisfies DraftWorkJournalEntryResponse);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
