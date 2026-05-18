import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { feedbackNotesModule } from "@/lib/container";
import {
  presentFeedback,
} from "@/modules/feedback-notes";
import { ok, errorResponse, handleApiError } from "@/modules/shared";
import { parseGenerateFeedbackRequest } from "../../../validation";
import {
  toFeedbackResponse,
  type GenerateFinalFeedbackResponse,
} from "./responses";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = await req.json();
    const parsed = parseGenerateFeedbackRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    feedbackNotesModule.bindRequest(supabase);
    const useCase = feedbackNotesModule.createGenerateFinalFeedbackUseCase({
      apiKey: parsed.value.geminiApiKey,
      model: parsed.value.model,
    });
    const feedback = await useCase.execute(user.id, id);
    const entries = await feedbackNotesModule.listEntries.execute(user.id, id);
    return ok(
      toFeedbackResponse(presentFeedback(feedback, entries.length)) satisfies GenerateFinalFeedbackResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
