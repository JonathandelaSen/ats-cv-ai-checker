import type { ContextType } from "./journal-context.entity";

export interface WorkJournalContextSuggestion {
  type: ContextType;
  name: string;
  role_or_label: string | null;
  is_current: boolean;
  source: "cv";
}
