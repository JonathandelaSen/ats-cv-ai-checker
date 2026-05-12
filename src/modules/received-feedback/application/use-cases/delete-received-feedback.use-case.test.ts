import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { createReceivedFeedbackFixture, makeReceivedFeedbackDeps } from "../../test-helpers";
import { DeleteReceivedFeedbackUseCase } from "./delete-received-feedback.use-case";

describe("DeleteReceivedFeedbackUseCase", () => {
  it("deletes feedback and records observability", async () => {
    const user = await createTestUser("received-feedback-delete");
    const existing = await createReceivedFeedbackFixture(user.id);
    const { receivedFeedbackRepo, tracker } = makeReceivedFeedbackDeps();

    await new DeleteReceivedFeedbackUseCase({
      receivedFeedbackRepo,
      tracker,
    }).execute(user.id, existing.id);

    await expect(receivedFeedbackRepo.findById(existing.idValue, existing.userIdValue)).resolves.toBeNull();
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "received_feedback_deleted", status: "success" })
    );
  });
});
