import { describe, expect, it, vi } from "vitest";
import { GenerateQuestionAnswerUseCase } from "./generate-question-answer.use-case";
import {
  processQuestionRepo,
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

describe("GenerateQuestionAnswerUseCase", () => {
  it("generates an answer via AI and saves it", async () => {
    const ai = aiService();
    const repo = processQuestionRepo();
    const result = await new GenerateQuestionAnswerUseCase({
      questionRepo: repo,
      aiService: ai,
      tracker: tracker(),
    }).execute({
      id: "question-1",
      userId: "user-1",
      apiKey: "key",
      model: "gemini-test",
      context: "My context",
      requestId: "req-1",
    });

    expect(ai.generateAnswer).toHaveBeenCalledOnce();
    expect(result?.question.toPrimitives()).toMatchObject({
      answer: "Generated answer",
      aiModel: "gemini-test",
    });
  });

  it("returns null when question does not exist", async () => {
    const repo = processQuestionRepo({ findById: async () => null });
    const result = await new GenerateQuestionAnswerUseCase({
      questionRepo: repo,
      aiService: aiService(),
      tracker: tracker(),
    }).execute({
      id: "missing",
      userId: "user-1",
      apiKey: "key",
      model: "gemini-test",
      context: "ctx",
      requestId: "req-1",
    });

    expect(result).toBeNull();
  });
});
