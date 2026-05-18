import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { workJournalModule } from "@/lib/container";
import {
  presentWorkJournalContext,
  presentWorkJournalContextSuggestion,
} from "@/modules/work-journal";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import { parseCreateWorkJournalContextRequest } from "../validation";
import {
  toWorkJournalContextResponse,
  toWorkJournalContextSuggestionResponse,
  type CreateWorkJournalContextResponse,
  type ListWorkJournalContextsResponse,
} from "./responses";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    workJournalModule.bindRequest(supabase);

    await workJournalModule.ensureDefaultContext.execute(user.id);
    const [contexts, suggestions] = await Promise.all([
      workJournalModule.listContexts.execute(user.id),
      workJournalModule.listContextSuggestions.execute(user.id),
    ]);

    return ok({
      contexts: contexts.map((context) =>
        toWorkJournalContextResponse(presentWorkJournalContext(context))
      ),
      suggestions: suggestions.map((suggestion) =>
        toWorkJournalContextSuggestionResponse(
          presentWorkJournalContextSuggestion(suggestion)
        )
      ),
    } satisfies ListWorkJournalContextsResponse);
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
    const parsed = parseCreateWorkJournalContextRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    workJournalModule.bindRequest(supabase);

    const context = await workJournalModule.createContext.execute({
      user_id: user.id,
      ...parsed.value,
    });

    return created(
      toWorkJournalContextResponse(
        presentWorkJournalContext(context)
      ) satisfies CreateWorkJournalContextResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
