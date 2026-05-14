import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { feedbackNotesModule } from "@/lib/container";
import {
  presentFeedbackEntry,
} from "@/modules/feedback-notes";
import { handleDomainError } from "@/modules/shared";
import { parseFeedbackEntryContentRequest } from "../../../validation";

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
    const body = await req.json();
    const parsed = parseFeedbackEntryContentRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error.message }, { status: parsed.error.status });
    }
    feedbackNotesModule.bindRequest(supabase);
    const entry = await feedbackNotesModule.createEntry.execute({
      user_id: user.id,
      feedback_id: id,
      content: parsed.value.content,
    });
    return NextResponse.json(presentFeedbackEntry(entry), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
