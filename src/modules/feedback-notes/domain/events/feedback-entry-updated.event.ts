import type { DomainEvent } from "@/modules/shared";

export class FeedbackEntryUpdatedEvent implements DomainEvent<{ entryId: string }> {
  readonly eventName = "feedback_entry_updated";
  readonly occurredAt = new Date();

  constructor(private readonly entryId: string) {}

  toPrimitives(): { entryId: string } {
    return { entryId: this.entryId };
  }
}
