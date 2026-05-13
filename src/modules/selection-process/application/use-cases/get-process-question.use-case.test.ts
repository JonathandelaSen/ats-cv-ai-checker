import { describe, expect, it } from "vitest";
import { GetProcessQuestionUseCase } from "./get-process-question.use-case";
import { processQuestionRepo } from "./selection-process-test-helpers.test";

describe("GetProcessQuestionUseCase", () => {
  it("gets a process question by id", async () => {
    const repo = processQuestionRepo();
    const result = await new GetProcessQuestionUseCase({ questionRepo: repo }).execute({
      id: "question-1",
      userId: "user-1",
    });

    expect(result?.question.id).toBe("question-1");
    expect(repo.findById).toHaveBeenCalledOnce();
  });
});
