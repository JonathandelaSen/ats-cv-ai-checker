import { describe, expect, it } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import {
  createEntryFixture,
  createFeedbackFixture,
  makeFeedbackDeps,
} from "../../test-helpers";
import { ListEntriesUseCase } from "./list-entries.use-case";

describe("ListEntriesUseCase", () => {
  it("lists entries for a feedback", async () => {
    const user = await createTestUser("feedback-list-entries");
    const { feedbackRepo, entryRepo } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id);
    const entry = await createEntryFixture(user.id, feedback.id);

    const result = await new ListEntriesUseCase({
      feedbackRepo,
      entryRepo,
    }).execute(user.id, feedback.id);

    expect(result.map((item) => item.id)).toEqual([entry.id]);
  });
});
