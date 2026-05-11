import type { DomainEvent } from "@/modules/shared";

export class WorkJournalContextUpdatedEvent
  implements DomainEvent<{ contextId: string; fields: string[] }>
{
  readonly eventName = "work_journal_context_updated";
  readonly occurredAt = new Date();

  constructor(
    private readonly contextId: string,
    private readonly fields: string[]
  ) {}

  toPrimitives(): { contextId: string; fields: string[] } {
    return { contextId: this.contextId, fields: this.fields };
  }
}
