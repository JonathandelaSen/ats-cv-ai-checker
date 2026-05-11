import { NextRequest, NextResponse } from "next/server";
import {
  createFeedbackNotesModule,
  presentFeedback,
} from "@/modules/feedback-notes";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
import {
  getAuthedSupabase,
  normalizeOptionalText,
  normalizeRequiredText,
  normalizeStatus,
} from "../validation";

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const status = normalizeStatus(req.nextUrl.searchParams.get("status"));
    if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const tracker = new SupabaseEventTracker();
    const mod = createFeedbackNotesModule(supabase, tracker);
    const feedbacks = await mod.listFeedbacks.execute(user.id, status);
    const withCounts = await Promise.all(
      feedbacks.map(async (feedback) => {
        const entries = await mod.listEntries.execute(user.id, feedback.id);
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
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await req.json()) as Record<string, unknown>;
    const personName = normalizeRequiredText(body.person_name);
    const finalFeedback =
      body.final_feedback === undefined
        ? null
        : normalizeOptionalText(body.final_feedback);
    if (!personName || finalFeedback === undefined) {
      return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
    }

    const tracker = new SupabaseEventTracker();
    const mod = createFeedbackNotesModule(supabase, tracker);
    const feedback = await mod.createFeedback.execute({
      user_id: user.id,
      person_name: personName,
      final_feedback: finalFeedback,
    });
    return NextResponse.json(presentFeedback(feedback, 0), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
