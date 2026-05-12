import type { DomainEvent } from "@/modules/shared";

export class ReceivedFeedbackDeletedEvent implements DomainEvent<{ feedbackId: string }> {
  readonly eventName = "received_feedback_deleted";
  readonly occurredAt = new Date();

  constructor(private readonly feedbackId: string) {}

  toPrimitives(): { feedbackId: string } {
    return { feedbackId: this.feedbackId };
  }
}
