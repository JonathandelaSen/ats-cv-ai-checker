import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import { handleDomainError } from "@/modules/shared";
import { parseDraftWorkJournalEntryRequest } from "../../validation";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = await req.json();
    const parsed = parseDraftWorkJournalEntryRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    workJournalModule.bindRequest(supabase);
    const draftUseCase = workJournalModule.createDraftEntryUseCase({
      apiKey: parsed.value.geminiApiKey,
      model: parsed.value.model,
    });

    const finalText = await draftUseCase.execute(user.id, parsed.value.contextId, {
      dateStart: parsed.value.dateStart,
      dateEnd: parsed.value.dateEnd,
      topic: parsed.value.topic,
      notes: parsed.value.notes,
    });

    return NextResponse.json({ final_text: finalText });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
