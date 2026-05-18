import {
  toWorkJournalEntryResponse,
  type WorkJournalEntryLegacy,
  type WorkJournalEntryResponse,
} from "@/features/work-journal/api/work-journal-types";

export type WorkJournalEntryPresenterOutput = WorkJournalEntryLegacy;

export type ListWorkJournalEntriesResponse = WorkJournalEntryResponse[];
export type CreateWorkJournalEntryResponse = WorkJournalEntryResponse;
export type UpdateWorkJournalEntryResponse = WorkJournalEntryResponse;

export interface DeleteWorkJournalEntryResponse {
  ok: true;
}

export { toWorkJournalEntryResponse };
