import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import {
  createEntryFixture,
  createFeedbackFixture,
  makeFeedbackDeps,
} from "../../test-helpers";
import { UpdateEntryUseCase } from "./update-entry.use-case";

describe("UpdateEntryUseCase", () => {
  it("updates an entry for active feedback", async () => {
    const user = await createTestUser("feedback-update-entry");
    const { feedbackRepo, entryRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id);
    const entry = await createEntryFixture(user.id, feedback.id);

    const updated = await new UpdateEntryUseCase({
      feedbackRepo,
      entryRepo,
      tracker,
    }).execute(user.id, entry.id, "Updated note");

    expect(updated.toPrimitives().content).toBe("Updated note");
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "feedback_entry_updated" })
    );
  });
});
