import { describe, expect, it } from "vitest";
import { ListProcessQuestionsUseCase } from "./list-process-questions.use-case";
import { processQuestionRepo } from "./selection-process-test-helpers.test";

describe("ListProcessQuestionsUseCase", () => {
  it("lists process questions with filters", async () => {
    const repo = processQuestionRepo();
    const result = await new ListProcessQuestionsUseCase({ questionRepo: repo }).execute({
      userId: "user-1",
      search: "why",
      cvId: "cv-1",
      analysisId: "analysis-1",
      answered: false,
    });

    expect(result).toHaveLength(1);
    expect(repo.search).toHaveBeenCalledOnce();
  });
});
