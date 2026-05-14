import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRequestContext } from "@/app/api/_shared/auth/request-context";
import { receivedFeedbackModule } from "@/lib/container";
import { presentReceivedFeedback } from "@/modules/received-feedback";
import { handleDomainError } from "@/modules/shared";
import {
  normalizeOptionalText,
  normalizeRequiredDate,
  normalizeRequiredText,
} from "./validation";

export async function GET() {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;
    receivedFeedbackModule.bindRequest(supabase);
    const feedback = await receivedFeedbackModule.listReceivedFeedback.execute(user.id);

    return NextResponse.json(feedback.map(presentReceivedFeedback));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthenticatedRequestContext();
    if (!authContext.ok) return authContext.response;
    const { supabase, user } = authContext;

    const body = (await req.json()) as Record<string, unknown>;
    const receivedDate = normalizeRequiredDate(body.receivedDate);
    const giverName = normalizeRequiredText(body.giverName);
    const feedbackText = normalizeRequiredText(body.feedbackText);
    const userNote = normalizeOptionalText(body.userNote);

    if (
      !receivedDate ||
      receivedDate > new Date().toISOString().slice(0, 10) ||
      !giverName ||
      giverName.length > 120 ||
      !feedbackText ||
      feedbackText.length > 10000 ||
      userNote === undefined ||
      (userNote?.length ?? 0) > 10000
    ) {
      return NextResponse.json({ error: "Invalid received feedback payload" }, { status: 400 });
    }
    receivedFeedbackModule.bindRequest(supabase);
    const feedback = await receivedFeedbackModule.createReceivedFeedback.execute({
      userId: user.id,
      receivedDate,
      giverName,
      feedbackText,
      userNote,
    });

    return NextResponse.json(presentReceivedFeedback(feedback), { status: 201 });
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}
