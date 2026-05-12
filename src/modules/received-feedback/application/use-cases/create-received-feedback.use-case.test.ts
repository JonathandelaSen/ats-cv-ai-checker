import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { makeReceivedFeedbackDeps } from "../../test-helpers";
import { CreateReceivedFeedbackUseCase } from "./create-received-feedback.use-case";

describe("CreateReceivedFeedbackUseCase", () => {
  it("creates received feedback and records observability", async () => {
    const user = await createTestUser("received-feedback-create");
    const { receivedFeedbackRepo, tracker } = makeReceivedFeedbackDeps();

    const feedback = await new CreateReceivedFeedbackUseCase({
      receivedFeedbackRepo,
      tracker,
    }).execute({
      userId: user.id,
      receivedDate: "2026-05-01",
      giverName: " Manager ",
      feedbackText: " Keep raising risks early. ",
      userNote: "",
      today: "2026-05-12",
    });

    expect(feedback.toPrimitives()).toMatchObject({
      userId: user.id,
      receivedDate: "2026-05-01",
      giverName: "Manager",
      feedbackText: "Keep raising risks early.",
      userNote: null,
    });
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "received_feedback_created", status: "success" })
    );
  });
});
