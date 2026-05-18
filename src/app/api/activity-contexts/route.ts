import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { activityContextsModule } from "@/lib/container";
import { presentActivityContext } from "@/modules/activity";
import { created, errorResponse, handleApiError, ok } from "@/modules/shared";
import { parseCreateActivityContextRequest } from "./validation";
import {
  toActivityContextResponse,
  type CreateActivityContextResponse,
  type ListActivityContextsResponse,
} from "./responses";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    activityContextsModule.bindRequest(supabase);
    const contexts = await activityContextsModule.listActivityContexts.execute(user.id);
    return ok({
      contexts: contexts.map((context) =>
        toActivityContextResponse(presentActivityContext(context))
      ),
    } satisfies ListActivityContextsResponse);
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
    const parsed = parseCreateActivityContextRequest(body);
    if (!parsed.ok) return errorResponse(parsed.error);

    activityContextsModule.bindRequest(supabase);
    const context = await activityContextsModule.createActivityContext.execute({
      userId: user.id,
      ...parsed.value,
    });
    return created(
      toActivityContextResponse(
        presentActivityContext(context)
      ) satisfies CreateActivityContextResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
