import type { WorkJournalEntry } from "../../domain/entities/journal-entry.entity";
import type {
  ListEntriesFilters,
  WorkJournalEntryRepository,
} from "../../domain/repositories/work-journal-entry.repository";

export class ListEntriesUseCase {
  constructor(private readonly deps: { entryRepo: WorkJournalEntryRepository }) {}

  async execute(userId: string, filters?: ListEntriesFilters): Promise<WorkJournalEntry[]> {
    return this.deps.entryRepo.list(userId, filters);
  }
}
