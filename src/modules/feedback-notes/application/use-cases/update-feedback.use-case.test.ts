import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { createFeedbackFixture, makeFeedbackDeps } from "../../test-helpers";
import { FeedbackClosedError } from "../../domain/errors/feedback-closed.error";
import { UpdateFeedbackUseCase } from "./update-feedback.use-case";

describe("UpdateFeedbackUseCase", () => {
  it("updates person name and final feedback", async () => {
    const user = await createTestUser("feedback-update");
    const { feedbackRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id, "Jon");

    const updated = await new UpdateFeedbackUseCase({
      feedbackRepo,
      tracker,
    }).execute(user.id, feedback.id, {
      person_name: "Jon - 2026",
      final_feedback: "Final",
    });

    expect(updated.toPrimitives()).toMatchObject({
      person_name: "Jon - 2026",
      final_feedback: "Final",
    });
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "feedback_final_feedback_updated" })
    );
  });

  it("rejects updates when feedback is closed", async () => {
    const user = await createTestUser("feedback-update-closed");
    const { feedbackRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id, "Jon");
    feedback.close(new Date().toISOString());
    await feedbackRepo.save(feedback);

    await expect(
      new UpdateFeedbackUseCase({ feedbackRepo, tracker }).execute(
        user.id,
        feedback.id,
        { final_feedback: "Nope" }
      )
    ).rejects.toBeInstanceOf(FeedbackClosedError);
  });
});
