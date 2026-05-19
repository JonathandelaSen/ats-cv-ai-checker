import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { activityContextsModule } from "@/lib/container";
import {
  presentActivityContext,
  presentActivityContextSuggestion,
} from "@/modules/activity-context";
import { created, errorResponse, handleApiError, ok } from "@/modules/shared";
import { parseActivityContextSuggestionRequest } from "../validation";
import {
  toActivityContextResponse,
  type ActivityContextSuggestionResponse,
  type CreateActivityContextResponse,
} from "../responses";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    activityContextsModule.bindRequest(supabase);
    const suggestions =
      await activityContextsModule.listActivityContextSuggestions.execute(user.id);
    return ok({
      suggestions: suggestions.map((suggestion) =>
        presentActivityContextSuggestion(suggestion)
      ),
    } satisfies { suggestions: ActivityContextSuggestionResponse[] });
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
    const parsed = parseActivityContextSuggestionRequest(body);
    if (!parsed.ok) return errorResponse(parsed.error);

    activityContextsModule.bindRequest(supabase);
    const result = await activityContextsModule.handleActivityContextSuggestion.execute({
      userId: user.id,
      ...parsed.value,
    });
    if ("ok" in result) return ok(result);
    return created(
      toActivityContextResponse(
        presentActivityContext(result)
      ) satisfies CreateActivityContextResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
