import type { DomainEvent } from "@/modules/shared";

export class FeedbackReopenedEvent implements DomainEvent<{ feedbackId: string }> {
  readonly eventName = "feedback_reopened";
  readonly occurredAt = new Date();

  constructor(private readonly feedbackId: string) {}

  toPrimitives(): { feedbackId: string } {
    return { feedbackId: this.feedbackId };
  }
}
