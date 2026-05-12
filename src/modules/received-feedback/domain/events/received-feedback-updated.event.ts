import type { DomainEvent } from "@/modules/shared";

export class ReceivedFeedbackUpdatedEvent implements DomainEvent<{ feedbackId: string; fields: string[] }> {
  readonly eventName = "received_feedback_updated";
  readonly occurredAt = new Date();

  constructor(
    private readonly feedbackId: string,
    private readonly fields: string[]
  ) {}

  toPrimitives(): { feedbackId: string; fields: string[] } {
    return { feedbackId: this.feedbackId, fields: this.fields };
  }
}
