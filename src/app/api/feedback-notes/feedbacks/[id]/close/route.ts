import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { feedbackNotesModule } from "@/lib/container";
import {
  presentFeedback,
} from "@/modules/feedback-notes";
import { ok, handleApiError } from "@/modules/shared";
import { toFeedbackResponse, type CloseFeedbackResponse } from "./responses";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    feedbackNotesModule.bindRequest(supabase);
    const feedback = await feedbackNotesModule.closeFeedback.execute(user.id, id);
    const entries = await feedbackNotesModule.listEntries.execute(user.id, id);
    return ok(
      toFeedbackResponse(presentFeedback(feedback, entries.length)) satisfies CloseFeedbackResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
