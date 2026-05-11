import type { ContextType, WorkJournalContext } from "../entities/journal-context.entity";

export interface CreateContextInput {
  user_id: string;
  type: ContextType;
  name: string;
  role_or_label?: string | null;
  is_default?: boolean;
  created_from_cv?: boolean;
}

export interface UpdateContextInput {
  name?: string;
  role_or_label?: string | null;
  status?: "active" | "archived";
  is_default?: boolean;
}

export interface WorkJournalContextRepository {
  list(userId: string): Promise<WorkJournalContext[]>;
  getById(id: string, userId: string): Promise<WorkJournalContext | null>;
  create(data: CreateContextInput): Promise<WorkJournalContext>;
  update(id: string, userId: string, data: UpdateContextInput): Promise<WorkJournalContext | null>;
  listHiddenSuggestionKeys(userId: string): Promise<Set<string>>;
  hideSuggestion(userId: string, input: { type: ContextType; name: string }): Promise<void>;
  findLatestEntryContextId(userId: string): Promise<string | null>;
}
