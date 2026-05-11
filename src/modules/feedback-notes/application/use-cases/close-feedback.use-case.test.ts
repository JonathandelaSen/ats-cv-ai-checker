import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { createFeedbackFixture, makeFeedbackDeps } from "../../test-helpers";
import { CloseFeedbackUseCase } from "./close-feedback.use-case";

describe("CloseFeedbackUseCase", () => {
  it("closes feedback and records observability", async () => {
    const user = await createTestUser("feedback-close");
    const { feedbackRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id);

    const closed = await new CloseFeedbackUseCase({
      feedbackRepo,
      tracker,
    }).execute(user.id, feedback.id);

    expect(closed.toPrimitives().status).toBe("closed");
    expect(closed.toPrimitives().closed_at).toEqual(expect.any(String));
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "feedback_closed" })
    );
  });
});
