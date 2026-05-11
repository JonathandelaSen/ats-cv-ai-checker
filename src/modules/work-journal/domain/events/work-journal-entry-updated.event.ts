import type { DomainEvent } from "@/modules/shared";

export class WorkJournalEntryUpdatedEvent
  implements DomainEvent<{ entryId: string; fields: string[] }>
{
  readonly eventName = "work_journal_entry_updated";
  readonly occurredAt = new Date();

  constructor(
    private readonly entryId: string,
    private readonly fields: string[]
  ) {}

  toPrimitives(): { entryId: string; fields: string[] } {
    return { entryId: this.entryId, fields: this.fields };
  }
}
