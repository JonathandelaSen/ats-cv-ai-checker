import type { DomainEvent } from "@/modules/shared";

export class FeedbackDeletedEvent implements DomainEvent<{ feedbackId: string }> {
  readonly eventName = "feedback_deleted";
  readonly occurredAt = new Date();

  constructor(private readonly feedbackId: string) {}

  toPrimitives(): { feedbackId: string } {
    return { feedbackId: this.feedbackId };
  }
}
