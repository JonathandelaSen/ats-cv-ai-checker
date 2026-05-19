import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import type { AIProvider } from "@/modules/shared";
import { FeedbackClosedError } from "../../domain/errors/feedback-closed.error";
import { FeedbackEntriesRequiredError } from "../../domain/errors/feedback-entries-required.error";
import { FeedbackNotFoundError } from "../../domain/errors/feedback-not-found.error";
import type { FeedbackAIServiceFactory } from "../../domain/repositories/feedback-ai-service.repository";
import type { FeedbackEntryRepository } from "../../domain/repositories/feedback-entry.repository";
import type { FeedbackRepository } from "../../domain/repositories/feedback.repository";
import { recordFeedbackEvent } from "./tracking";

export class GenerateFinalFeedbackUseCase {
  constructor(
    private readonly deps: {
      feedbackRepo: FeedbackRepository;
      entryRepo: FeedbackEntryRepository;
      aiFactory: FeedbackAIServiceFactory;
      tracker: EventTracker;
    }
  ) {}

  async execute(
    userId: string,
    feedbackId: string,
    aiConfig: { provider: AIProvider; apiKey?: string; model: string },
  ) {
    const feedback = await this.deps.feedbackRepo.findById(feedbackId, userId);
    if (!feedback) throw new FeedbackNotFoundError(feedbackId);
    if (!feedback.isActive()) throw new FeedbackClosedError(feedbackId);
    const entries = await this.deps.entryRepo.listByFeedback(feedbackId, userId);
    if (entries.length === 0) throw new FeedbackEntriesRequiredError(feedbackId);

    const feedbackPrimitives = feedback.toPrimitives();
    const aiService = this.deps.aiFactory.create(aiConfig);
    const finalFeedback = await aiService.generateFinalFeedback({
      personName: feedbackPrimitives.person_name,
      entries: entries.map((entry) => {
        const primitives = entry.toPrimitives();
        return {
          content: primitives.content,
          created_at: primitives.created_at,
        };
      }),
    });
    feedback.updateFinalFeedback(finalFeedback);
    const saved = await this.deps.feedbackRepo.save(feedback);

    await recordFeedbackEvent(this.deps.tracker, {
      userId,
      stage: "feedback_final_feedback_generated",
      metadata: {
        feedbackId,
        entryCount: entries.length,
        provider: aiConfig.provider,
        model: aiConfig.model,
      },
    });

    return saved;
  }
}
