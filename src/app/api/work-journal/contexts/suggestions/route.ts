import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import { presentWorkJournalContext } from "@/modules/work-journal";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import { parseWorkJournalSuggestionActionRequest } from "../../validation";

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = await req.json();
    const parsed = parseWorkJournalSuggestionActionRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    workJournalModule.bindRequest(supabase);

    const result = await workJournalModule.handleSuggestionAction.execute({
      userId: user.id,
      ...parsed.value,
    });

    if ("ok" in result) return ok(result);
    return created(presentWorkJournalContext(result));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
