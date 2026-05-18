import { NextRequest } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { feedbackNotesModule } from "@/lib/container";
import { presentFeedback } from "@/modules/feedback-notes";
import { ok, created, errorResponse, handleApiError } from "@/modules/shared";
import {
  parseCreateFeedbackRequest,
  parseListFeedbacksRequest,
} from "../validation";
import {
  toFeedbackResponse,
  type CreateFeedbackResponse,
  type ListFeedbacksResponse,
} from "./responses";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const parsed = parseListFeedbacksRequest(req.nextUrl.searchParams);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    feedbackNotesModule.bindRequest(supabase);
    const feedbacks = await feedbackNotesModule.listFeedbacks.execute(user.id, parsed.value.status);
    const withCounts = await Promise.all(
      feedbacks.map(async (feedback) => {
        const entries = await feedbackNotesModule.listEntries.execute(user.id, feedback.id);
        return presentFeedback(feedback, entries.length);
      })
    );
    return ok(withCounts.map(toFeedbackResponse) satisfies ListFeedbacksResponse);
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
    const parsed = parseCreateFeedbackRequest(body);
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }
    feedbackNotesModule.bindRequest(supabase);
    const feedback = await feedbackNotesModule.createFeedback.execute({
      user_id: user.id,
      ...parsed.value,
    });
    return created(
      toFeedbackResponse(presentFeedback(feedback, 0)) satisfies CreateFeedbackResponse
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
