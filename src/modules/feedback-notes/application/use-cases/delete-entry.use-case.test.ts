import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import {
  createEntryFixture,
  createFeedbackFixture,
  makeFeedbackDeps,
} from "../../test-helpers";
import { DeleteEntryUseCase } from "./delete-entry.use-case";

describe("DeleteEntryUseCase", () => {
  it("deletes an entry for active feedback", async () => {
    const user = await createTestUser("feedback-delete-entry");
    const { feedbackRepo, entryRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id);
    const entry = await createEntryFixture(user.id, feedback.id);

    await new DeleteEntryUseCase({ feedbackRepo, entryRepo, tracker }).execute(
      user.id,
      entry.id
    );

    await expect(entryRepo.findById(entry.id, user.id)).resolves.toBeNull();
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "feedback_entry_deleted" })
    );
  });
});
