import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { FeedbackEntry } from "../../domain/entities/feedback-entry.entity";
import { FeedbackClosedError } from "../../domain/errors/feedback-closed.error";
import { FeedbackNotFoundError } from "../../domain/errors/feedback-not-found.error";
import type { FeedbackEntryRepository } from "../../domain/repositories/feedback-entry.repository";
import type { FeedbackRepository } from "../../domain/repositories/feedback.repository";
import { recordFeedbackEvent } from "./tracking";

export interface CreateEntryInput {
  user_id: string;
  feedback_id: string;
  content: string;
}

export class CreateEntryUseCase {
  constructor(
    private readonly deps: {
      feedbackRepo: FeedbackRepository;
      entryRepo: FeedbackEntryRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: CreateEntryInput): Promise<FeedbackEntry> {
    const feedback = await this.deps.feedbackRepo.findById(
      input.feedback_id,
      input.user_id
    );
    if (!feedback) throw new FeedbackNotFoundError(input.feedback_id);
    if (!feedback.isActive()) throw new FeedbackClosedError(input.feedback_id);

    const now = new Date().toISOString();
    const entry = await this.deps.entryRepo.save(
      FeedbackEntry.create({
        id: crypto.randomUUID(),
        user_id: input.user_id,
        feedback_id: input.feedback_id,
        content: input.content,
        now,
      })
    );

    await recordFeedbackEvent(this.deps.tracker, {
      userId: input.user_id,
      stage: "feedback_entry_created",
      metadata: { feedbackId: input.feedback_id, entryId: entry.id },
    });

    return entry;
  }
}
