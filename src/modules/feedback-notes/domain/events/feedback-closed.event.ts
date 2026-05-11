import type { DomainEvent } from "@/modules/shared";

export class FeedbackClosedEvent implements DomainEvent<{ feedbackId: string }> {
  readonly eventName = "feedback_closed";
  readonly occurredAt = new Date();

  constructor(private readonly feedbackId: string) {}

  toPrimitives(): { feedbackId: string } {
    return { feedbackId: this.feedbackId };
  }
}
