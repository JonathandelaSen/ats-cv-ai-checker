import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { createFeedbackFixture, makeFeedbackDeps } from "../../test-helpers";
import { FeedbackClosedError } from "../../domain/errors/feedback-closed.error";
import { CreateEntryUseCase } from "./create-entry.use-case";

describe("CreateEntryUseCase", () => {
  it("creates an entry for active feedback", async () => {
    const user = await createTestUser("feedback-create-entry");
    const { feedbackRepo, entryRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id);

    const entry = await new CreateEntryUseCase({
      feedbackRepo,
      entryRepo,
      tracker,
    }).execute({
      user_id: user.id,
      feedback_id: feedback.id,
      content: "Strong ownership.",
    });

    expect(entry.toPrimitives()).toMatchObject({
      feedback_id: feedback.id,
      content: "Strong ownership.",
    });
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "feedback_entry_created" })
    );
  });

  it("rejects entry creation for closed feedback", async () => {
    const user = await createTestUser("feedback-create-entry-closed");
    const { feedbackRepo, entryRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id);
    feedback.close(new Date().toISOString());
    await feedbackRepo.save(feedback);

    await expect(
      new CreateEntryUseCase({ feedbackRepo, entryRepo, tracker }).execute({
        user_id: user.id,
        feedback_id: feedback.id,
        content: "Nope",
      })
    ).rejects.toBeInstanceOf(FeedbackClosedError);
  });
});
