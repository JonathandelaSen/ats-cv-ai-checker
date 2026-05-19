import { describe, expect, it, vi } from "vitest";
import { createTestUser } from "@/modules/test-helpers/setup";
import {
  createEntryFixture,
  createFeedbackFixture,
  makeFeedbackDeps,
} from "../../test-helpers";
import { FeedbackEntriesRequiredError } from "../../domain/errors/feedback-entries-required.error";
import { GenerateFinalFeedbackUseCase } from "./generate-final-feedback.use-case";

describe("GenerateFinalFeedbackUseCase", () => {
  it("generates and stores final feedback from all entries", async () => {
    const user = await createTestUser("feedback-generate");
    const { feedbackRepo, entryRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id, "Jon");
    await createEntryFixture(user.id, feedback.id, "First note");
    await createEntryFixture(user.id, feedback.id, "Second note");
    const aiService = {
      generateFinalFeedback: vi.fn(async () => "Generated feedback"),
    };

    const updated = await new GenerateFinalFeedbackUseCase({
      feedbackRepo,
      entryRepo,
      aiFactory: { create: vi.fn(() => aiService) },
        tracker,
    }).execute(user.id, feedback.id, { provider: "mock", model: "mock-model" });

    expect(aiService.generateFinalFeedback).toHaveBeenCalledWith({
      personName: "Jon",
      entries: expect.arrayContaining([
        expect.objectContaining({ content: "First note" }),
        expect.objectContaining({ content: "Second note" }),
      ]),
    });
    expect(updated.toPrimitives().final_feedback).toBe("Generated feedback");
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "feedback_final_feedback_generated" })
    );
  });

  it("requires at least one entry", async () => {
    const user = await createTestUser("feedback-generate-empty");
    const { feedbackRepo, entryRepo, tracker } = makeFeedbackDeps();
    const feedback = await createFeedbackFixture(user.id);

    await expect(
      new GenerateFinalFeedbackUseCase({
        feedbackRepo,
        entryRepo,
        aiFactory: { create: vi.fn(() => ({ generateFinalFeedback: vi.fn() })) },
        tracker,
      }).execute(user.id, feedback.id, { provider: "mock", model: "mock-model" })
    ).rejects.toBeInstanceOf(FeedbackEntriesRequiredError);
  });
});
