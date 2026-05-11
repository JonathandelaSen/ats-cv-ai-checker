import type { IsoDate, UserId } from "@/modules/shared";
import type { WorkJournalEntry } from "../entities/journal-entry.entity";
import type { WorkJournalContextId } from "../value-objects/work-journal-context-id.value-object";
import type { WorkJournalEntryId } from "../value-objects/work-journal-entry-id.value-object";
import type { WorkJournalTopic } from "../value-objects/work-journal-topic.value-object";

export interface WorkJournalEntrySearchCriteria {
  userId: UserId;
  contextId?: WorkJournalContextId | null;
  search?: WorkJournalTopic | null;
  topic?: WorkJournalTopic | null;
  dateFrom?: IsoDate | null;
  dateTo?: IsoDate | null;
}

export interface WorkJournalEntryRepository {
  search(criteria: WorkJournalEntrySearchCriteria): Promise<WorkJournalEntry[]>;
  findById(id: WorkJournalEntryId, userId: UserId): Promise<WorkJournalEntry | null>;
  save(entry: WorkJournalEntry): Promise<WorkJournalEntry>;
  delete(id: WorkJournalEntryId, userId: UserId): Promise<void>;
}
