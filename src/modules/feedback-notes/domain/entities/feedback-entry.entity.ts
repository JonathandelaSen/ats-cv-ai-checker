import { AggregateRoot } from "@/modules/shared";
import { FeedbackEntryCreatedEvent } from "../events/feedback-entry-created.event";
import { FeedbackEntryDeletedEvent } from "../events/feedback-entry-deleted.event";
import { FeedbackEntryUpdatedEvent } from "../events/feedback-entry-updated.event";

export interface FeedbackEntryPrimitives {
  id: string;
  user_id: string;
  feedback_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackEntryParams {
  id: string;
  user_id: string;
  feedback_id: string;
  content: string;
  now: string;
}

export class FeedbackEntry extends AggregateRoot {
  private constructor(private primitives: FeedbackEntryPrimitives) {
    super();
  }

  static create(params: CreateFeedbackEntryParams): FeedbackEntry {
    const entry = new FeedbackEntry({
      id: params.id,
      user_id: params.user_id,
      feedback_id: params.feedback_id,
      content: params.content.trim(),
      created_at: params.now,
      updated_at: params.now,
    });
    entry.recordDomainEvent(
      new FeedbackEntryCreatedEvent(params.id, params.feedback_id)
    );
    return entry;
  }

  static fromPrimitives(primitives: FeedbackEntryPrimitives): FeedbackEntry {
    return new FeedbackEntry({ ...primitives });
  }

  get id(): string {
    return this.primitives.id;
  }

  get userId(): string {
    return this.primitives.user_id;
  }

  get feedbackId(): string {
    return this.primitives.feedback_id;
  }

  updateContent(content: string): void {
    this.primitives.content = content.trim();
    this.recordDomainEvent(new FeedbackEntryUpdatedEvent(this.id));
  }

  delete(): void {
    this.recordDomainEvent(new FeedbackEntryDeletedEvent(this.id));
  }

  toPrimitives(): FeedbackEntryPrimitives {
    return { ...this.primitives };
  }
}
