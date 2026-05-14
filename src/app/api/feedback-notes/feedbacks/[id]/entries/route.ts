import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { feedbackNotesModule } from "@/lib/container";
import {
  presentFeedbackEntry,
} from "@/modules/feedback-notes";
import { handleDomainError } from "@/modules/shared";
import { normalizeRequiredText } from "../../../validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    feedbackNotesModule.bindRequest(supabase);
    const entries = await feedbackNotesModule.listEntries.execute(user.id, id);
    return NextResponse.json(entries.map(presentFeedbackEntry));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const content = normalizeRequiredText(body.content);
    if (!content) {
      return NextResponse.json({ error: "Entry content is required" }, { status: 400 });
    }
    feedbackNotesModule.bindRequest(supabase);
    const entry = await feedbackNotesModule.createEntry.execute({
      user_id: user.id,
      feedback_id: id,
      content,
    });
    return NextResponse.json(presentFeedbackEntry(entry), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
