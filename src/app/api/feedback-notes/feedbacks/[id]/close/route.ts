import { NextRequest, NextResponse } from "next/server";
import {
  createFeedbackNotesModule,
  presentFeedback,
} from "@/modules/feedback-notes";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
import { getAuthedSupabase } from "../../../validation";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const tracker = new SupabaseEventTracker();
    const mod = createFeedbackNotesModule(supabase, tracker);
    const feedback = await mod.closeFeedback.execute(user.id, id);
    const entries = await mod.listEntries.execute(user.id, id);
    return NextResponse.json(presentFeedback(feedback, entries.length));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
