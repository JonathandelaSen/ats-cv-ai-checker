import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { FeedbackNotFoundError } from "../../domain/errors/feedback-not-found.error";
import type { FeedbackRepository } from "../../domain/repositories/feedback.repository";
import { recordFeedbackEvent } from "./tracking";

export class CloseFeedbackUseCase {
  constructor(
    private readonly deps: {
      feedbackRepo: FeedbackRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(userId: string, feedbackId: string) {
    const feedback = await this.deps.feedbackRepo.findById(feedbackId, userId);
    if (!feedback) throw new FeedbackNotFoundError(feedbackId);
    feedback.close(new Date().toISOString());
    const saved = await this.deps.feedbackRepo.save(feedback);
    await recordFeedbackEvent(this.deps.tracker, {
      userId,
      stage: "feedback_closed",
      metadata: { feedbackId },
    });
    return saved;
  }
}
