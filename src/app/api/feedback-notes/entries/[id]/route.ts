import { NextRequest, NextResponse } from "next/server";
import { feedbackNotesModule } from "@/lib/container";
import {
  presentFeedbackEntry,
} from "@/modules/feedback-notes";
import { handleDomainError } from "@/modules/shared";
import { getAuthedSupabase, normalizeRequiredText } from "../../validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const content = normalizeRequiredText(body.content);
    if (!content) {
      return NextResponse.json({ error: "Entry content is required" }, { status: 400 });
    }
    feedbackNotesModule.bindRequest(supabase);
    const entry = await feedbackNotesModule.updateEntry.execute(user.id, id, content);
    return NextResponse.json(presentFeedbackEntry(entry));
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
    feedbackNotesModule.bindRequest(supabase);
    await feedbackNotesModule.deleteEntry.execute(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
