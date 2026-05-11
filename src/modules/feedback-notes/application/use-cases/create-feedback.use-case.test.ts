import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { makeFeedbackDeps } from "../../test-helpers";
import { CreateFeedbackUseCase } from "./create-feedback.use-case";

describe("CreateFeedbackUseCase", () => {
  it("creates feedback and records observability", async () => {
    const user = await createTestUser("feedback-create");
    const { feedbackRepo, tracker } = makeFeedbackDeps();

    const feedback = await new CreateFeedbackUseCase({
      feedbackRepo,
      tracker,
    }).execute({ user_id: user.id, person_name: " Jon " });

    expect(feedback.toPrimitives()).toMatchObject({
      user_id: user.id,
      person_name: "Jon",
      status: "active",
    });
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "feedback_created", status: "success" })
    );
  });
});
