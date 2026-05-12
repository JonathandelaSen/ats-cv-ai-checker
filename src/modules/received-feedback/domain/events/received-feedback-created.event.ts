import type { DomainEvent } from "@/modules/shared";

export class ReceivedFeedbackCreatedEvent implements DomainEvent<{ feedbackId: string }> {
  readonly eventName = "received_feedback_created";
  readonly occurredAt = new Date();

  constructor(private readonly feedbackId: string) {}

  toPrimitives(): { feedbackId: string } {
    return { feedbackId: this.feedbackId };
  }
}
