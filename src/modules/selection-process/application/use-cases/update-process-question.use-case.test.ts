import { describe, expect, it } from "vitest";
import { UpdateProcessQuestionUseCase } from "./update-process-question.use-case";
import {
  processQuestion,
  processQuestionRepo,
  readModel,
  tracker,
} from "./selection-process-test-helpers.test";

describe("UpdateProcessQuestionUseCase", () => {
  it("updates question fields and records observability", async () => {
    const repo = processQuestionRepo();
    const result = await new UpdateProcessQuestionUseCase({
      questionRepo: repo,
      tracker: tracker(),
    }).execute({
      id: "question-1",
      userId: "user-1",
      question: "Tell me about yourself",
      answer: "Answer",
      aiModel: "gemini",
      aiGeneratedAt: "2026-05-13T11:00:00.000Z",
    });

    expect(result?.question.toPrimitives()).toMatchObject({
      question: "Tell me about yourself",
      answer: "Answer",
      aiModel: "gemini",
    });
  });

  it("returns null when the question does not exist", async () => {
    const repo = processQuestionRepo({ findById: async () => null });
    const result = await new UpdateProcessQuestionUseCase({
      questionRepo: repo,
      tracker: tracker(),
    }).execute({ id: "missing", userId: "user-1", answer: "Nope" });

    expect(result).toBeNull();
  });

  it("keeps unspecified fields", async () => {
    const existing = readModel({ question: processQuestion({ context: "old" }) });
    const repo = processQuestionRepo({ findById: async () => existing });
    const result = await new UpdateProcessQuestionUseCase({
      questionRepo: repo,
      tracker: tracker(),
    }).execute({ id: "question-1", userId: "user-1", answer: "new" });

    expect(result?.question.toPrimitives()).toMatchObject({
      context: "old",
      answer: "new",
    });
  });
});
