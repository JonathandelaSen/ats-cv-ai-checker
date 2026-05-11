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
} from "../../validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const updates: { person_name?: string; final_feedback?: string | null } = {};

    if (body.person_name !== undefined) {
      const personName = normalizeRequiredText(body.person_name);
      if (!personName) {
        return NextResponse.json({ error: "Person name is required" }, { status: 400 });
      }
      updates.person_name = personName;
    }
    if (body.final_feedback !== undefined) {
      const finalFeedback = normalizeOptionalText(body.final_feedback);
      if (finalFeedback === undefined) {
        return NextResponse.json({ error: "Invalid final feedback" }, { status: 400 });
      }
      updates.final_feedback = finalFeedback;
    }

    const tracker = new SupabaseEventTracker();
    const mod = createFeedbackNotesModule(supabase, tracker);
    const feedback = await mod.updateFeedback.execute(user.id, id, updates);
    const entries = await mod.listEntries.execute(user.id, id);
    return NextResponse.json(presentFeedback(feedback, entries.length));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const tracker = new SupabaseEventTracker();
    const mod = createFeedbackNotesModule(supabase, tracker);
    await mod.deleteFeedback.execute(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
