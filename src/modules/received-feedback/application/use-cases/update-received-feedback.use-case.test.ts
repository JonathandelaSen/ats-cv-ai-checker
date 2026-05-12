import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { createReceivedFeedbackFixture, makeReceivedFeedbackDeps } from "../../test-helpers";
import { UpdateReceivedFeedbackUseCase } from "./update-received-feedback.use-case";

describe("UpdateReceivedFeedbackUseCase", () => {
  it("updates feedback and records observability", async () => {
    const user = await createTestUser("received-feedback-update");
    const existing = await createReceivedFeedbackFixture(user.id);
    const { receivedFeedbackRepo, tracker } = makeReceivedFeedbackDeps();

    const updated = await new UpdateReceivedFeedbackUseCase({
      receivedFeedbackRepo,
      tracker,
    }).execute(user.id, existing.id, {
      receivedDate: "2026-05-02",
      giverName: "Lead",
      feedbackText: "Updated feedback.",
      userNote: null,
      today: "2026-05-12",
    });

    expect(updated.toPrimitives()).toMatchObject({
      receivedDate: "2026-05-02",
      giverName: "Lead",
      feedbackText: "Updated feedback.",
      userNote: null,
    });
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "received_feedback_updated", status: "success" })
    );
  });
});
