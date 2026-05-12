import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { createReceivedFeedbackFixture, makeReceivedFeedbackDeps } from "../../test-helpers";
import { ListReceivedFeedbackUseCase } from "./list-received-feedback.use-case";

describe("ListReceivedFeedbackUseCase", () => {
  it("lists the user's latest 100 feedback items by received date", async () => {
    const user = await createTestUser("received-feedback-list");
    await createReceivedFeedbackFixture(user.id, { receivedDate: "2026-05-01", giverName: "A" });
    const newest = await createReceivedFeedbackFixture(user.id, {
      receivedDate: "2026-05-03",
      giverName: "B",
    });
    const { receivedFeedbackRepo } = makeReceivedFeedbackDeps();

    const result = await new ListReceivedFeedbackUseCase({ receivedFeedbackRepo }).execute(user.id);

    expect(result[0].id).toBe(newest.id);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
