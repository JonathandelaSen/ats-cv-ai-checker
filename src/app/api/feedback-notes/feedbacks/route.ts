import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { feedbackNotesModule } from "@/lib/container";
import { presentFeedback } from "@/modules/feedback-notes";
import { handleDomainError } from "@/modules/shared";
import {
  parseCreateFeedbackRequest,
  parseListFeedbacksRequest,
} from "../validation";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const parsed = parseListFeedbacksRequest(req.nextUrl.searchParams);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    feedbackNotesModule.bindRequest(supabase);
    const feedbacks = await feedbackNotesModule.listFeedbacks.execute(user.id, parsed.value.status);
    const withCounts = await Promise.all(
      feedbacks.map(async (feedback) => {
        const entries = await feedbackNotesModule.listEntries.execute(user.id, feedback.id);
        return presentFeedback(feedback, entries.length);
      })
    );
    return NextResponse.json(withCounts);
  } catch (error: unknown) {
    return handleDomainError(error);
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
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    feedbackNotesModule.bindRequest(supabase);
    const feedback = await feedbackNotesModule.createFeedback.execute({
      user_id: user.id,
      ...parsed.value,
    });
    return NextResponse.json(presentFeedback(feedback, 0), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
