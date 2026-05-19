import { describe, expect, it, vi } from "vitest";
import { EditQuestionAnswerUseCase } from "./edit-question-answer.use-case";
import {
  processQuestion,
  processQuestionRepo,
  readModel,
  tracker,
} from "./selection-process-test-helpers.test";
import type { InterviewQuestionAIService } from "../../domain/repositories/interview-question-ai.service";

function aiService(
  overrides: Partial<InterviewQuestionAIService> = {},
): InterviewQuestionAIService {
  return {
    generateAnswer: vi.fn(async () => "Generated answer"),
    editAnswer: vi.fn(async () => "Edited answer"),
    ...overrides,
  };
}

describe("EditQuestionAnswerUseCase", () => {
  it("edits an answer via AI and saves it", async () => {
    const existing = readModel({
      question: processQuestion({ answer: "Old answer" }),
    });
    const ai = aiService();
    const repo = processQuestionRepo({ findById: async () => existing });
    const result = await new EditQuestionAnswerUseCase({
      questionRepo: repo,
      aiFactory: { create: vi.fn(() => ai) },
      tracker: tracker(),
    }).execute({
      id: "question-1",
      userId: "user-1",
      provider: "mock",
      apiKey: "key",
      model: "gemini-test",
      context: "My context",
      instruction: "Make it shorter",
      requestId: "req-1",
    });

    expect(ai.editAnswer).toHaveBeenCalledOnce();
    expect(ai.editAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        currentAnswer: "Old answer",
        instruction: "Make it shorter",
      }),
    );
    expect(result?.question.toPrimitives()).toMatchObject({
      answer: "Edited answer",
      aiModel: "gemini-test",
    });
  });

  it("returns null when question does not exist", async () => {
    const repo = processQuestionRepo({ findById: async () => null });
    const ai = aiService();
    const result = await new EditQuestionAnswerUseCase({
      questionRepo: repo,
      aiFactory: { create: vi.fn(() => ai) },
      tracker: tracker(),
    }).execute({
      id: "missing",
      userId: "user-1",
      provider: "mock",
      apiKey: "key",
      model: "gemini-test",
      context: "ctx",
      instruction: "edit",
      requestId: "req-1",
    });

    expect(result).toBeNull();
  });
});
