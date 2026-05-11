import type { WorkJournalContext } from "../entities/journal-context.entity";

export interface DraftEntryInput {
  context: Pick<WorkJournalContext, "type" | "name" | "roleOrLabel">;
  dateStart: string;
  dateEnd?: string | null;
  topic?: string | null;
  notes: string;
}

export interface JournalAIService {
  draftEntry(input: DraftEntryInput): Promise<string>;
}
