import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { activityContextsModule } from "@/lib/container";
import { presentActivityContext } from "@/modules/activity";
import { errorResponse, handleApiError, ok } from "@/modules/shared";
import { parseUpdateActivityContextRequest } from "../validation";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = await req.json();
    const parsed = parseUpdateActivityContextRequest(body);
    if (!parsed.ok) return errorResponse(parsed.error);

    const { id } = await context.params;
    activityContextsModule.bindRequest(supabase);
    const activityContext = await activityContextsModule.updateActivityContext.execute({
      id,
      userId: user.id,
      ...parsed.value,
    });
    return ok(presentActivityContext(activityContext));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await context.params;

    activityContextsModule.bindRequest(supabase);
    const result = await activityContextsModule.deleteActivityContext.execute({
      id,
      userId: user.id,
    });
    return ok(result);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
