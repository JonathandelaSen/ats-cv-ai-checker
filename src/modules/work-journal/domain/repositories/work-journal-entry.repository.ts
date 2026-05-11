import type { EntryInputMode, WorkJournalEntry } from "../entities/journal-entry.entity";

export interface CreateEntryInput {
  user_id: string;
  context_id: string;
  date_start: string;
  date_end: string | null;
  topic: string | null;
  input_mode: EntryInputMode;
  raw_notes: string;
  final_text: string;
}

export interface UpdateEntryInput {
  context_id?: string;
  date_start?: string;
  date_end?: string | null;
  topic?: string | null;
  input_mode?: EntryInputMode;
  raw_notes?: string;
  final_text?: string;
}

export interface ListEntriesFilters {
  contextId?: string | null;
  search?: string | null;
  topic?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface WorkJournalEntryRepository {
  list(userId: string, filters?: ListEntriesFilters): Promise<WorkJournalEntry[]>;
  getById(id: string, userId: string): Promise<WorkJournalEntry | null>;
  create(data: CreateEntryInput): Promise<WorkJournalEntry>;
  update(id: string, userId: string, data: UpdateEntryInput): Promise<WorkJournalEntry | null>;
  delete(id: string, userId: string): Promise<boolean>;
}
