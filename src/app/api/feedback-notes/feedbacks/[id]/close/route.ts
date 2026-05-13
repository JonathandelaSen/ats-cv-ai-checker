import { NextRequest, NextResponse } from "next/server";
import { feedbackNotesModule } from "@/lib/container";
import {
  presentFeedback,
} from "@/modules/feedback-notes";
import { handleDomainError } from "@/modules/shared";
import { getAuthedSupabase } from "../../../validation";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    feedbackNotesModule.bindRequest(supabase);
    const feedback = await feedbackNotesModule.closeFeedback.execute(user.id, id);
    const entries = await feedbackNotesModule.listEntries.execute(user.id, id);
    return NextResponse.json(presentFeedback(feedback, entries.length));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
