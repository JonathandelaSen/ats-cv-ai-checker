import { UserId } from "@/modules/shared";
import type { WorkJournalEntry } from "../../domain/entities/journal-entry.entity";
import type { WorkJournalEntryRepository } from "../../domain/repositories/work-journal-entry.repository";
import {
  WorkJournalContextId,
  WorkJournalDate,
  WorkJournalTopic,
} from "../../domain/value-objects/work-journal.value-object";

export interface ListEntriesFilters {
  contextId?: string | null;
  search?: string | null;
  topic?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export class ListEntriesUseCase {
  constructor(private readonly deps: { entryRepo: WorkJournalEntryRepository }) {}

  async execute(userId: string, filters?: ListEntriesFilters): Promise<WorkJournalEntry[]> {
    return this.deps.entryRepo.search({
      userId: UserId.fromPrimitives(userId),
      contextId: filters?.contextId
        ? WorkJournalContextId.fromPrimitives(filters.contextId)
        : null,
      search: filters?.search ? WorkJournalTopic.fromPrimitives(filters.search) : null,
      topic: filters?.topic ? WorkJournalTopic.fromPrimitives(filters.topic) : null,
      dateFrom: filters?.dateFrom ? WorkJournalDate.fromPrimitives(filters.dateFrom) : null,
      dateTo: filters?.dateTo ? WorkJournalDate.fromPrimitives(filters.dateTo) : null,
    });
  }
}
