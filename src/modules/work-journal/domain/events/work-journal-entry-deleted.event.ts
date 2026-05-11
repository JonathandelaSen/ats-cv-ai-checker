import type { DomainEvent } from "@/modules/shared";

export class WorkJournalEntryDeletedEvent implements DomainEvent<{ entryId: string }> {
  readonly eventName = "work_journal_entry_deleted";
  readonly occurredAt = new Date();

  constructor(private readonly entryId: string) {}

  toPrimitives(): { entryId: string } {
    return { entryId: this.entryId };
  }
}
