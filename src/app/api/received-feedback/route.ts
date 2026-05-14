import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { receivedFeedbackModule } from "@/lib/container";
import { presentReceivedFeedback } from "@/modules/received-feedback";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import { parseCreateReceivedFeedbackRequest } from "./validation";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    receivedFeedbackModule.bindRequest(supabase);
    const feedback = await receivedFeedbackModule.listReceivedFeedback.execute(user.id);

    return ok(feedback.map(presentReceivedFeedback));
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
    const parsed = parseCreateReceivedFeedbackRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }

    receivedFeedbackModule.bindRequest(supabase);
    const feedback = await receivedFeedbackModule.createReceivedFeedback.execute({
      userId: user.id,
      ...parsed.value,
    });

    return created(presentReceivedFeedback(feedback));
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
