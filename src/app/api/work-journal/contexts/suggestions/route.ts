import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import { presentWorkJournalContext } from "@/modules/work-journal";
import { handleDomainError } from "@/modules/shared";
import { parseWorkJournalSuggestionActionRequest } from "../../validation";

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = await req.json();
    const parsed = parseWorkJournalSuggestionActionRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    workJournalModule.bindRequest(supabase);

    const result = await workJournalModule.handleSuggestionAction.execute({
      userId: user.id,
      ...parsed.value,
    });

    if ("ok" in result) return NextResponse.json(result);
    return NextResponse.json(presentWorkJournalContext(result), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
