import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import { createFeedbackFixture, makeFeedbackDeps } from "../../test-helpers";
import { ListFeedbacksUseCase } from "./list-feedbacks.use-case";

describe("ListFeedbacksUseCase", () => {
  it("lists active feedbacks by default", async () => {
    const user = await createTestUser("feedback-list");
    const { feedbackRepo } = makeFeedbackDeps();
    const active = await createFeedbackFixture(user.id, "Jon");
    const closed = await createFeedbackFixture(user.id, "Ana");
    closed.close(new Date().toISOString());
    await feedbackRepo.save(closed);

    const result = await new ListFeedbacksUseCase({ feedbackRepo }).execute(user.id);

    expect(result.map((feedback) => feedback.id)).toEqual([active.id]);
  });
});
