import type { DomainEvent } from "@/modules/shared";

export class WorkJournalEntryCreatedEvent implements DomainEvent<{ entryId: string }> {
  readonly eventName = "work_journal_entry_created";
  readonly occurredAt = new Date();

  constructor(private readonly entryId: string) {}

  toPrimitives(): { entryId: string } {
    return { entryId: this.entryId };
  }
}
