import type { UserId } from "@/modules/shared";
import type { WorkJournalContext } from "../entities/journal-context.entity";
import type { WorkJournalContextSuggestion } from "../value-objects/context-suggestion.value-object";
import type {
  ContextType,
  WorkJournalContextId,
  WorkJournalSuggestionKey,
} from "../value-objects/work-journal.value-object";

export interface WorkJournalContextSearchCriteria {
  userId: UserId;
}

export interface WorkJournalContextRepository {
  search(criteria: WorkJournalContextSearchCriteria): Promise<WorkJournalContext[]>;
  findById(id: WorkJournalContextId, userId: UserId): Promise<WorkJournalContext | null>;
  save(context: WorkJournalContext): Promise<WorkJournalContext>;
  delete(id: WorkJournalContextId, userId: UserId): Promise<void>;
  listHiddenSuggestionKeys(userId: UserId): Promise<Set<WorkJournalSuggestionKey>>;
  hideSuggestion(userId: UserId, suggestion: WorkJournalContextSuggestion): Promise<void>;
  findLatestEntryContextId(userId: UserId): Promise<WorkJournalContextId | null>;
}

export type { ContextType };
