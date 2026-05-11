import type { DomainEvent } from "@/modules/shared";

export class WorkJournalContextCreatedEvent implements DomainEvent<{ contextId: string }> {
  readonly eventName = "work_journal_context_created";
  readonly occurredAt = new Date();

  constructor(private readonly contextId: string) {}

  toPrimitives(): { contextId: string } {
    return { contextId: this.contextId };
  }
}
