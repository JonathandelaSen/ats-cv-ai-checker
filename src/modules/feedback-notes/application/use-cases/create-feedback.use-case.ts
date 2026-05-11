import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { Feedback } from "../../domain/entities/feedback.entity";
import type { FeedbackRepository } from "../../domain/repositories/feedback.repository";
import { recordFeedbackEvent } from "./tracking";

export interface CreateFeedbackInput {
  user_id: string;
  person_name: string;
  final_feedback?: string | null;
}

export class CreateFeedbackUseCase {
  constructor(
    private readonly deps: {
      feedbackRepo: FeedbackRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: CreateFeedbackInput): Promise<Feedback> {
    const feedback = await this.deps.feedbackRepo.save(
      Feedback.create({
        id: crypto.randomUUID(),
        user_id: input.user_id,
        person_name: input.person_name,
        final_feedback: input.final_feedback,
        now: new Date().toISOString(),
      })
    );

    await recordFeedbackEvent(this.deps.tracker, {
      userId: input.user_id,
      stage: "feedback_created",
      metadata: { feedbackId: feedback.id },
    });

    return feedback;
  }
}
