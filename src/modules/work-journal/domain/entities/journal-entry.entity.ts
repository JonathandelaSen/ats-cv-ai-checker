import type { WorkJournalContext } from "./journal-context.entity";

export type EntryInputMode = "manual" | "ai_assisted";

export interface WorkJournalEntry {
  id: string;
  user_id: string;
  context_id: string;
  date_start: string;
  date_end: string | null;
  topic: string | null;
  input_mode: EntryInputMode;
  raw_notes: string;
  final_text: string;
  created_at: string;
  updated_at: string;
  context?: WorkJournalContext | null;
}
