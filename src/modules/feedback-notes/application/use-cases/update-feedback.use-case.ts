import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { FeedbackClosedError } from "../../domain/errors/feedback-closed.error";
import { FeedbackNotFoundError } from "../../domain/errors/feedback-not-found.error";
import type { FeedbackRepository } from "../../domain/repositories/feedback.repository";
import { recordFeedbackEvent } from "./tracking";

export interface UpdateFeedbackInput {
  person_name?: string;
  final_feedback?: string | null;
}

export class UpdateFeedbackUseCase {
  constructor(
    private readonly deps: {
      feedbackRepo: FeedbackRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(
    userId: string,
    feedbackId: string,
    input: UpdateFeedbackInput
  ) {
    const feedback = await this.deps.feedbackRepo.findById(feedbackId, userId);
    if (!feedback) throw new FeedbackNotFoundError(feedbackId);
    if (!feedback.isActive()) throw new FeedbackClosedError(feedbackId);

    const fields: string[] = [];
    if (input.person_name !== undefined) {
      feedback.updatePersonName(input.person_name);
      fields.push("person_name");
    }
    if (input.final_feedback !== undefined) {
      feedback.updateFinalFeedback(input.final_feedback);
      fields.push("final_feedback");
    }

    const saved = await this.deps.feedbackRepo.save(feedback);
    await recordFeedbackEvent(this.deps.tracker, {
      userId,
      stage: fields.includes("final_feedback")
        ? "feedback_final_feedback_updated"
        : "feedback_updated",
      metadata: { feedbackId, fields },
    });
    return saved;
  }
}
