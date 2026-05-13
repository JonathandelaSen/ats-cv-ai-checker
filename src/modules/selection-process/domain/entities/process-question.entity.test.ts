import { describe, expect, it } from "vitest";
import { Timestamp, UserId } from "@/modules/shared";
import { ProcessQuestion } from "./process-question.entity";
import { JobOpportunityId } from "../value-objects/job-opportunity-id.value-object";
import { ProcessQuestionId } from "../value-objects/process-question-id.value-object";
import { ProcessQuestionText } from "../value-objects/process-question-text.value-object";

const now = "2026-05-13T10:00:00.000Z";

describe("ProcessQuestion", () => {
  it("creates and answers a process question", () => {
    const question = ProcessQuestion.create({
      id: ProcessQuestionId.fromPrimitives("question-1"),
      userId: UserId.fromPrimitives("user-1"),
      jobOpportunityId: JobOpportunityId.fromPrimitives("job-1"),
      question: ProcessQuestionText.fromPrimitives("Why us?"),
      context: "I like the product",
      answer: null,
      aiModel: null,
      aiGeneratedAt: null,
      sourceJobMatchAnalysisId: "analysis-1",
      legacyInterviewQuestionId: null,
      legacyCvId: null,
      createdAt: Timestamp.fromPrimitives(now),
      updatedAt: Timestamp.fromPrimitives(now),
    });

    question.updateAnswer({
      answer: "Because the product solves a real problem.",
      aiModel: "gemini",
      aiGeneratedAt: "2026-05-13T11:00:00.000Z",
      updatedAt: Timestamp.fromPrimitives("2026-05-13T11:00:00.000Z"),
    });

    expect(question.toPrimitives()).toMatchObject({
      question: "Why us?",
      answer: "Because the product solves a real problem.",
      aiModel: "gemini",
    });
  });
});
