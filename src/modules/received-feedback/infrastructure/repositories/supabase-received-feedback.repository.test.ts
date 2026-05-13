import { describe, expect, it } from "vitest";
import { createTestUser, getSupabaseClient } from "@/modules/test-helpers/setup";
import { UserId } from "@/modules/shared";
import { ReceivedFeedback } from "../../domain/entities/received-feedback.entity";
import { ReceivedFeedbackId } from "../../domain/value-objects/received-feedback-id.value-object";
import { ReceivedFeedbackDate } from "../../domain/value-objects/received-feedback-date.value-object";
import { ReceivedFeedbackGiverName } from "../../domain/value-objects/received-feedback-giver-name.value-object";
import { ReceivedFeedbackText } from "../../domain/value-objects/received-feedback-text.value-object";
import { ReceivedFeedbackNote } from "../../domain/value-objects/received-feedback-note.value-object";
import { SupabaseReceivedFeedbackRepository } from "./supabase-received-feedback.repository";

const repo = new SupabaseReceivedFeedbackRepository();

repo.bindRequest(getSupabaseClient());

describe("SupabaseReceivedFeedbackRepository", () => {
  it("persists and lists the user's latest received feedback", async () => {
    const user = await createTestUser("received-feedback-repo-list");
    const otherUser = await createTestUser("received-feedback-repo-other");
    const oldItem = await repo.save(makeFeedback(user.id, "2026-05-01", "Old"));
    const newItem = await repo.save(makeFeedback(user.id, "2026-05-02", "New"));
    await repo.save(makeFeedback(otherUser.id, "2026-05-03", "Other"));

    const result = await repo.search({
      userId: UserId.fromPrimitives(user.id),
      limit: 100,
    });

    expect(result.map((item) => item.id)).toEqual([newItem.id, oldItem.id]);
  });

  it("updates and deletes received feedback", async () => {
    const user = await createTestUser("received-feedback-repo-update");
    const feedback = await repo.save(makeFeedback(user.id, "2026-05-01", "Manager"));
    feedback.update({
      feedbackText: ReceivedFeedbackText.fromPrimitives("Updated text."),
      updatedAt: new Date().toISOString(),
    });
    await repo.save(feedback);

    await expect(
      repo.findById(feedback.idValue, feedback.userIdValue).then((item) => item?.toPrimitives())
    ).resolves.toMatchObject({ feedbackText: "Updated text." });

    await repo.delete(feedback.idValue, feedback.userIdValue);
    await expect(repo.findById(feedback.idValue, feedback.userIdValue)).resolves.toBeNull();
  });
});

function makeFeedback(userId: string, receivedDate: string, giverName: string): ReceivedFeedback {
  const now = new Date().toISOString();
  return ReceivedFeedback.create({
    id: ReceivedFeedbackId.fromPrimitives(crypto.randomUUID()),
    userId: UserId.fromPrimitives(userId),
    receivedDate: ReceivedFeedbackDate.fromPrimitives(receivedDate, "2026-05-12"),
    giverName: ReceivedFeedbackGiverName.fromPrimitives(giverName),
    feedbackText: ReceivedFeedbackText.fromPrimitives("Useful feedback."),
    userNote: ReceivedFeedbackNote.fromPrimitives(null),
    createdAt: now,
    updatedAt: now,
  });
}
