import { NextRequest, NextResponse } from "next/server";
import {
  createReceivedFeedbackModule,
  presentReceivedFeedback,
} from "@/modules/received-feedback";
import { SupabaseEventTracker, handleDomainError } from "@/modules/shared";
import {
  getAuthedSupabase,
  normalizeOptionalText,
  normalizeRequiredDate,
  normalizeRequiredText,
} from "./validation";

export async function GET() {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tracker = new SupabaseEventTracker();
    const mod = createReceivedFeedbackModule(supabase, tracker);
    const feedback = await mod.listReceivedFeedback.execute(user.id);

    return NextResponse.json(feedback.map(presentReceivedFeedback));
  } catch (error: unknown) {
    return handleDomainError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const tracker = new SupabaseEventTracker();
    const mod = createReceivedFeedbackModule(supabase, tracker);
    const feedback = await mod.createReceivedFeedback.execute({
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
