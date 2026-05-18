export type WorkJournalContextType = "employment" | "project" | "personal" | "other";
export type WorkJournalContextStatus = "active" | "archived";
export type WorkJournalEntryInputMode = "manual" | "ai_assisted";

export interface WorkJournalContextResponse {
  id: string;
  userId: string;
  type: WorkJournalContextType;
  name: string;
  roleOrLabel: string | null;
  status: WorkJournalContextStatus;
  isDefault: boolean;
  createdFromCv: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkJournalContextSuggestionResponse {
  type: WorkJournalContextType;
  name: string;
  roleOrLabel: string | null;
}

export interface WorkJournalEntryResponse {
  id: string;
  userId: string;
  contextId: string;
  dateStart: string;
  dateEnd: string | null;
  topic: string | null;
  inputMode: WorkJournalEntryInputMode;
  rawNotes: string;
  finalText: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  context?: WorkJournalContextResponse | null;
}

export interface WorkJournalContextLegacy {
  id: string;
  user_id: string;
  type: WorkJournalContextType;
  name: string;
  role_or_label: string | null;
  status: WorkJournalContextStatus;
  is_default: boolean;
  created_from_cv: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkJournalContextSuggestionLegacy {
  type: WorkJournalContextType;
  name: string;
  role_or_label: string | null;
}

export interface WorkJournalEntryLegacy {
  id: string;
  user_id: string;
  context_id: string;
  date_start: string;
  date_end: string | null;
  topic: string | null;
  input_mode: WorkJournalEntryInputMode;
  raw_notes: string;
  final_text: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  context?: WorkJournalContextLegacy | null;
}

export function toWorkJournalContextResponse(
  input: WorkJournalContextLegacy
): WorkJournalContextResponse {
  return {
    id: input.id,
    userId: input.user_id,
    type: input.type,
    name: input.name,
    roleOrLabel: input.role_or_label,
    status: input.status,
    isDefault: input.is_default,
    createdFromCv: input.created_from_cv,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };
}

export function toWorkJournalContextSuggestionResponse(
  input: WorkJournalContextSuggestionLegacy
): WorkJournalContextSuggestionResponse {
  return {
    type: input.type,
    name: input.name,
    roleOrLabel: input.role_or_label,
  };
}

export function toWorkJournalEntryResponse(
  input: WorkJournalEntryLegacy
): WorkJournalEntryResponse {
  return {
    id: input.id,
    userId: input.user_id,
    contextId: input.context_id,
    dateStart: input.date_start,
    dateEnd: input.date_end,
    topic: input.topic,
    inputMode: input.input_mode,
    rawNotes: input.raw_notes,
    finalText: input.final_text,
    metadata: input.metadata ?? {},
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    context: input.context
      ? toWorkJournalContextResponse(input.context)
      : (input.context ?? null),
  };
}

export function toWorkJournalContextLegacy(
  input: WorkJournalContextResponse
): WorkJournalContextLegacy {
  return {
    id: input.id,
    user_id: input.userId,
    type: input.type,
    name: input.name,
    role_or_label: input.roleOrLabel,
    status: input.status,
    is_default: input.isDefault,
    created_from_cv: input.createdFromCv,
    created_at: input.createdAt,
    updated_at: input.updatedAt,
  };
}

export function toWorkJournalContextSuggestionLegacy(
  input: WorkJournalContextSuggestionResponse
): WorkJournalContextSuggestionLegacy {
  return {
    type: input.type,
    name: input.name,
    role_or_label: input.roleOrLabel,
  };
}

export function toWorkJournalEntryLegacy(
  input: WorkJournalEntryResponse
): WorkJournalEntryLegacy {
  return {
    id: input.id,
    user_id: input.userId,
    context_id: input.contextId,
    date_start: input.dateStart,
    date_end: input.dateEnd,
    topic: input.topic,
    input_mode: input.inputMode,
    raw_notes: input.rawNotes,
    final_text: input.finalText,
    metadata: input.metadata ?? {},
    created_at: input.createdAt,
    updated_at: input.updatedAt,
    context: input.context ? toWorkJournalContextLegacy(input.context) : null,
  };
}
