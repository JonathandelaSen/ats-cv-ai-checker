import type { UserId } from "@/modules/shared";
import type { WorkJournalEntry } from "../entities/journal-entry.entity";
import type {
  WorkJournalContextId,
  WorkJournalDate,
  WorkJournalEntryId,
  WorkJournalTopic,
} from "../value-objects/work-journal.value-object";

export interface WorkJournalEntrySearchCriteria {
  userId: UserId;
  contextId?: WorkJournalContextId | null;
  search?: WorkJournalTopic | null;
  topic?: WorkJournalTopic | null;
  dateFrom?: WorkJournalDate | null;
  dateTo?: WorkJournalDate | null;
}

export interface WorkJournalEntryRepository {
  search(criteria: WorkJournalEntrySearchCriteria): Promise<WorkJournalEntry[]>;
  findById(id: WorkJournalEntryId, userId: UserId): Promise<WorkJournalEntry | null>;
  save(entry: WorkJournalEntry): Promise<WorkJournalEntry>;
  delete(id: WorkJournalEntryId, userId: UserId): Promise<void>;
}
