import type { DomainEvent } from "@/modules/shared";

export class FeedbackEntryCreatedEvent
  implements DomainEvent<{ entryId: string; feedbackId: string }>
{
  readonly eventName = "feedback_entry_created";
  readonly occurredAt = new Date();

  constructor(
    private readonly entryId: string,
    private readonly feedbackId: string
  ) {}

  toPrimitives(): { entryId: string; feedbackId: string } {
    return { entryId: this.entryId, feedbackId: this.feedbackId };
  }
}
