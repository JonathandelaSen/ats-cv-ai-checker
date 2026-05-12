import { UserId } from "@/modules/shared";
import { createMockTracker, getSupabaseClient } from "@/modules/test-helpers/setup";
import { ReceivedFeedback } from "./domain/entities/received-feedback.entity";
import { ReceivedFeedbackDate } from "./domain/value-objects/received-feedback-date.value-object";
import { ReceivedFeedbackGiverName } from "./domain/value-objects/received-feedback-giver-name.value-object";
import { ReceivedFeedbackId } from "./domain/value-objects/received-feedback-id.value-object";
import { ReceivedFeedbackNote } from "./domain/value-objects/received-feedback-note.value-object";
import { ReceivedFeedbackText } from "./domain/value-objects/received-feedback-text.value-object";
import { SupabaseReceivedFeedbackRepository } from "./infrastructure/repositories/supabase-received-feedback.repository";

export function makeReceivedFeedbackDeps() {
  const receivedFeedbackRepo = new SupabaseReceivedFeedbackRepository(getSupabaseClient());
  const tracker = createMockTracker();
  return { receivedFeedbackRepo, tracker };
}

export async function createReceivedFeedbackFixture(
  userId: string,
  overrides: {
    receivedDate?: string;
    giverName?: string;
    feedbackText?: string;
    userNote?: string | null;
  } = {}
) {
  const { receivedFeedbackRepo } = makeReceivedFeedbackDeps();
  const now = new Date().toISOString();
  return receivedFeedbackRepo.save(
    ReceivedFeedback.create({
      id: ReceivedFeedbackId.fromPrimitives(crypto.randomUUID()),
      userId: UserId.fromPrimitives(userId),
      receivedDate: ReceivedFeedbackDate.fromPrimitives(overrides.receivedDate ?? "2026-05-01", "2026-05-12"),
      giverName: ReceivedFeedbackGiverName.fromPrimitives(overrides.giverName ?? "Manager"),
      feedbackText: ReceivedFeedbackText.fromPrimitives(overrides.feedbackText ?? "Useful feedback."),
      userNote: ReceivedFeedbackNote.fromPrimitives(overrides.userNote ?? null),
      createdAt: now,
      updatedAt: now,
    })
  );
}
