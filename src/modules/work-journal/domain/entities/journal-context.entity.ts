export type ContextType = "employment" | "project";
export type ContextStatus = "active" | "archived";

export interface WorkJournalContext {
  id: string;
  user_id: string;
  type: ContextType;
  name: string;
  role_or_label: string | null;
  status: ContextStatus;
  is_default: boolean;
  created_from_cv: boolean;
  created_at: string;
  updated_at: string;
}
