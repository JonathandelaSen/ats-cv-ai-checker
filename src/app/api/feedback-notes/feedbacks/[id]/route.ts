import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { feedbackNotesModule } from "@/lib/container";
import {
  presentFeedback,
} from "@/modules/feedback-notes";
import { handleDomainError } from "@/modules/shared";
import {
  normalizeOptionalText,
  normalizeRequiredText,
} from "../../validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
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
    feedbackNotesModule.bindRequest(supabase);
    const feedback = await feedbackNotesModule.updateFeedback.execute(user.id, id, updates);
    const entries = await feedbackNotesModule.listEntries.execute(user.id, id);
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
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    feedbackNotesModule.bindRequest(supabase);
    await feedbackNotesModule.deleteFeedback.execute(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
