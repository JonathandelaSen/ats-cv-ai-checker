import {
  toWorkJournalContextResponse,
  toWorkJournalContextSuggestionResponse,
  type WorkJournalContextLegacy,
  type WorkJournalContextResponse,
  type WorkJournalContextSuggestionLegacy,
  type WorkJournalContextSuggestionResponse,
} from "@/features/work-journal/api/work-journal-types";

export type WorkJournalContextPresenterOutput = WorkJournalContextLegacy;
export type WorkJournalContextSuggestionPresenterOutput =
  WorkJournalContextSuggestionLegacy;

export interface ListWorkJournalContextsResponse {
  contexts: WorkJournalContextResponse[];
  suggestions: WorkJournalContextSuggestionResponse[];
}

export type CreateWorkJournalContextResponse = WorkJournalContextResponse;
export type UpdateWorkJournalContextResponse = WorkJournalContextResponse;

export { toWorkJournalContextResponse, toWorkJournalContextSuggestionResponse };
