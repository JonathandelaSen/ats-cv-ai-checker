import { describe, expect, it } from "vitest";
import { DeleteProcessQuestionUseCase } from "./delete-process-question.use-case";
import { processQuestionRepo, tracker } from "./selection-process-test-helpers.test";

describe("DeleteProcessQuestionUseCase", () => {
  it("deletes a process question", async () => {
    const repo = processQuestionRepo();
    const deleted = await new DeleteProcessQuestionUseCase({
      questionRepo: repo,
      tracker: tracker(),
    }).execute({ id: "question-1", userId: "user-1" });

    expect(deleted).toBe(true);
    expect(repo.delete).toHaveBeenCalledOnce();
  });
});
