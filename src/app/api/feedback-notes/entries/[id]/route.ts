import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { feedbackNotesModule } from "@/lib/container";
import {
  presentFeedbackEntry,
} from "@/modules/feedback-notes";
import { ok, errorResponse, handleApiError } from "@/modules/shared";
import { parseFeedbackEntryContentRequest } from "../../validation";
import {
  toFeedbackEntryResponse,
  type DeleteFeedbackEntryResponse,
  type UpdateFeedbackEntryResponse,
} from "./responses";

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
    const parsed = parseFeedbackEntryContentRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    feedbackNotesModule.bindRequest(supabase);
    const entry = await feedbackNotesModule.updateEntry.execute(user.id, id, parsed.value.content);
    return ok(
      toFeedbackEntryResponse(presentFeedbackEntry(entry)) satisfies UpdateFeedbackEntryResponse
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
    await feedbackNotesModule.deleteEntry.execute(user.id, id);
    return ok({ ok: true } satisfies DeleteFeedbackEntryResponse);
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
