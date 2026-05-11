import type { DomainEvent } from "@/modules/shared";

export class FeedbackUpdatedEvent
  implements DomainEvent<{ feedbackId: string; fields: string[] }>
{
  readonly eventName = "feedback_updated";
  readonly occurredAt = new Date();

  constructor(
    private readonly feedbackId: string,
    private readonly fields: string[]
  ) {}

  toPrimitives(): { feedbackId: string; fields: string[] } {
    return { feedbackId: this.feedbackId, fields: this.fields };
  }
}
