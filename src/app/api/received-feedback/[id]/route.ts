import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { receivedFeedbackModule } from "@/lib/container";
import {
  presentReceivedFeedback,
} from "@/modules/received-feedback";
import { handleDomainError } from "@/modules/shared";
import {
  normalizeOptionalText,
  normalizeRequiredDate,
  normalizeRequiredText,
} from "../validation";

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
    const updates: {
      receivedDate?: string;
      giverName?: string;
      feedbackText?: string;
      userNote?: string | null;
    } = {};

    if (body.receivedDate !== undefined) {
      const receivedDate = normalizeRequiredDate(body.receivedDate);
      if (!receivedDate || receivedDate > new Date().toISOString().slice(0, 10)) {
        return NextResponse.json({ error: "Invalid received date" }, { status: 400 });
      }
      updates.receivedDate = receivedDate;
    }
    if (body.giverName !== undefined) {
      const giverName = normalizeRequiredText(body.giverName);
      if (!giverName || giverName.length > 120) {
        return NextResponse.json({ error: "Giver name is required" }, { status: 400 });
      }
      updates.giverName = giverName;
    }
    if (body.feedbackText !== undefined) {
      const feedbackText = normalizeRequiredText(body.feedbackText);
      if (!feedbackText || feedbackText.length > 10000) {
        return NextResponse.json({ error: "Feedback text is required" }, { status: 400 });
      }
      updates.feedbackText = feedbackText;
    }
    if (body.userNote !== undefined) {
      const userNote = normalizeOptionalText(body.userNote);
      if (userNote === undefined || (userNote?.length ?? 0) > 10000) {
        return NextResponse.json({ error: "Invalid private note" }, { status: 400 });
      }
      updates.userNote = userNote;
    }
    receivedFeedbackModule.bindRequest(supabase);
    const feedback = await receivedFeedbackModule.updateReceivedFeedback.execute(user.id, id, updates);

    return NextResponse.json(presentReceivedFeedback(feedback));
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
    receivedFeedbackModule.bindRequest(supabase);
    await receivedFeedbackModule.deleteReceivedFeedback.execute(user.id, id);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
