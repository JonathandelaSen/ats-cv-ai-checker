import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { receivedFeedbackModule } from "@/lib/container";
import { presentReceivedFeedback } from "@/modules/received-feedback";
import { ok, errorResponse, handleApiError } from "@/modules/shared";
import { parseUpdateReceivedFeedbackRequest } from "../validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    const body = await req.json();
    const parsed = parseUpdateReceivedFeedbackRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }

    receivedFeedbackModule.bindRequest(supabase);
    const feedback = await receivedFeedbackModule.updateReceivedFeedback.execute(
      user.id,
      id,
      parsed.value
    );

    return ok(presentReceivedFeedback(feedback));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const { id } = await params;
    receivedFeedbackModule.bindRequest(supabase);
    await receivedFeedbackModule.deleteReceivedFeedback.execute(user.id, id);

    return ok({ ok: true });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
