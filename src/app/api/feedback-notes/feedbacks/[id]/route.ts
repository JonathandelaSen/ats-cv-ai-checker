import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { feedbackNotesModule } from "@/lib/container";
import {
  presentFeedback,
} from "@/modules/feedback-notes";
import { ok, errorResponse, handleApiError, notFound } from "@/modules/shared";
import { parseUpdateFeedbackRequest } from "../../validation";
import {
  toFeedbackResponse,
  type DeleteFeedbackResponse,
  type GetFeedbackResponse,
  type UpdateFeedbackResponse,
} from "./responses";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    feedbackNotesModule.bindRequest(supabase);
    const feedbacks = await feedbackNotesModule.listFeedbacks.execute(user.id, "all");
    const feedback = feedbacks.find((item) => item.id === id);
    if (!feedback) notFound("Feedback not found");
    const entries = await feedbackNotesModule.listEntries.execute(user.id, id);
    return ok(
      toFeedbackResponse(presentFeedback(feedback, entries.length)) satisfies GetFeedbackResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

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
    const parsed = parseUpdateFeedbackRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    feedbackNotesModule.bindRequest(supabase);
    const feedback = await feedbackNotesModule.updateFeedback.execute(user.id, id, parsed.value);
    const entries = await feedbackNotesModule.listEntries.execute(user.id, id);
    return ok(
      toFeedbackResponse(presentFeedback(feedback, entries.length)) satisfies UpdateFeedbackResponse
    );
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
    feedbackNotesModule.bindRequest(supabase);
    await feedbackNotesModule.deleteFeedback.execute(user.id, id);
    return ok({ ok: true } satisfies DeleteFeedbackResponse);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
