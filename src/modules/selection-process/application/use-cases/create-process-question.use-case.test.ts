import { describe, expect, it } from "vitest";
import { CreateProcessQuestionUseCase } from "./create-process-question.use-case";
import { processQuestionRepo, tracker } from "./selection-process-test-helpers.test";

describe("CreateProcessQuestionUseCase", () => {
  it("creates a process question and records observability", async () => {
    const repo = processQuestionRepo();
    const events = tracker();
    const result = await new CreateProcessQuestionUseCase({
      questionRepo: repo,
      tracker: events,
    }).execute({
      userId: "user-1",
      question: "Why us?",
      context: "Because",
      answer: null,
      legacyCvId: "cv-1",
      sourceJobMatchAnalysisId: "analysis-1",
      requestId: "req-1",
    });

    expect(result.question.toPrimitives()).toMatchObject({
      question: "Why us?",
      legacyCvId: "cv-1",
      sourceJobMatchAnalysisId: "analysis-1",
    });
    expect(events.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "selection_process_question_created" })
    );
  });
});
