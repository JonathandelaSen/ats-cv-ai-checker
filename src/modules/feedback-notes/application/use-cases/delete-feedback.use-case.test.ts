import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import {
  createEntryFixture,
  createFeedbackFixture,
  makeFeedbackDeps,
} from "../../test-helpers";
import { DeleteFeedbackUseCase } from "./delete-feedback.use-case";

describe("DeleteFeedbackUseCase", () => {
  it("hard deletes feedback and cascades entries", async () => {
    const user = await createTestUser("feedback-delete");
    const { feedbackRepo, entryRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id);
    const entry = await createEntryFixture(user.id, feedback.id);

    await new DeleteFeedbackUseCase({ feedbackRepo, tracker }).execute(
      user.id,
      feedback.id
    );

    await expect(feedbackRepo.findById(feedback.id, user.id)).resolves.toBeNull();
    await expect(entryRepo.findById(entry.id, user.id)).resolves.toBeNull();
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "feedback_deleted" })
    );
  });
});
