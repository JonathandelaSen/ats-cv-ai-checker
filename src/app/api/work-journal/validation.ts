import type {
  ContextType as WorkJournalContextType,
  EntryInputMode as WorkJournalEntryInputMode,
} from "@/modules/work-journal";

type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

export interface CreateWorkJournalContextHttpInput {
  type: WorkJournalContextType;
  name: string;
  role_or_label: string | null;
  is_default: boolean;
  created_from_cv: boolean;
}

export interface UpdateWorkJournalContextHttpInput {
  name?: string;
  role_or_label?: string | null;
  status?: "active" | "archived";
  is_default?: boolean;
}

export interface WorkJournalSuggestionActionHttpInput {
  action: "promote" | "hide";
  type: WorkJournalContextType;
  name: string;
  role_or_label: string | null;
  is_default: boolean;
}

export interface ListWorkJournalEntriesHttpInput {
  contextId: string | null;
  search: string | null;
  topic: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface CreateWorkJournalEntryHttpInput {
  context_id: string;
  date_start: string;
  date_end: string | null;
  topic: string | null;
  input_mode: WorkJournalEntryInputMode;
  raw_notes: string;
  final_text: string;
}

export interface UpdateWorkJournalEntryHttpInput {
  context_id?: string;
  date_start?: string;
  date_end?: string | null;
  topic?: string | null;
  input_mode?: WorkJournalEntryInputMode;
  raw_notes?: string;
  final_text?: string;
}

export interface DraftWorkJournalEntryHttpInput extends AIRequestConfig {
  contextId: string;
  dateStart: string;
  dateEnd: string | null;
  topic: string | null;
  notes: string;
}

function validationError(message: string): Result<never, HttpValidationError> {
  return { ok: false, error: { message, status: 400 } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalText(value: unknown) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function normalizeRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeOptionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function normalizeRequiredDate(value: unknown) {
  if (typeof value !== "string") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeContextType(value: unknown): WorkJournalContextType | null {
  return value === "employment" || value === "project" || value === "personal" || value === "other"
    ? value
    : null;
}

function normalizeInputMode(value: unknown): WorkJournalEntryInputMode | null {
  return value === "manual" || value === "ai_assisted" ? value : null;
}

export function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCreateWorkJournalContextRequest(
  body: unknown
): Result<CreateWorkJournalContextHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const type = normalizeContextType(body.type);
  const name = normalizeRequiredText(body.name);
  const role_or_label =
    body.role_or_label === undefined ? null : normalizeOptionalText(body.role_or_label);
  if (!type || !name || role_or_label === undefined) {
    return validationError("Invalid context payload");
  }

  return {
    ok: true,
    value: {
      type,
      name,
      role_or_label,
      is_default: Boolean(body.is_default),
      created_from_cv: Boolean(body.created_from_cv),
    },
  };
}

export function parseUpdateWorkJournalContextRequest(
  body: unknown
): Result<UpdateWorkJournalContextHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const updates: UpdateWorkJournalContextHttpInput = {};
  if (body.name !== undefined) {
    const name = normalizeRequiredText(body.name);
    if (!name) return validationError("Name is required");
    updates.name = name;
  }
  if (body.role_or_label !== undefined) {
    const role = normalizeOptionalText(body.role_or_label);
    if (role === undefined) return validationError("Invalid label");
    updates.role_or_label = role;
  }
  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "archived") {
      return validationError("Invalid status");
    }
    updates.status = body.status;
  }
  if (body.is_default !== undefined) updates.is_default = Boolean(body.is_default);
  return { ok: true, value: updates };
}

export function parseWorkJournalSuggestionActionRequest(
  body: unknown
): Result<WorkJournalSuggestionActionHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const action = body.action;
  const type = normalizeContextType(body.type);
  const name = normalizeRequiredText(body.name);
  const role_or_label =
    body.role_or_label === undefined ? null : normalizeOptionalText(body.role_or_label);
  if (!type || !name || role_or_label === undefined) {
    return validationError("Invalid suggestion payload");
  }
  if (action !== "promote" && action !== "hide") {
    return validationError("Invalid suggestion action");
  }

  return {
    ok: true,
    value: { action, type, name, role_or_label, is_default: Boolean(body.is_default) },
  };
}

export function parseListWorkJournalEntriesRequest(
  params: URLSearchParams
): Result<ListWorkJournalEntriesHttpInput, HttpValidationError> {
  return {
    ok: true,
    value: {
      contextId: params.get("contextId"),
      search: params.get("q"),
      topic: params.get("topic"),
      dateFrom: params.get("dateFrom"),
      dateTo: params.get("dateTo"),
    },
  };
}

export function parseCreateWorkJournalEntryRequest(
  body: unknown
): Result<CreateWorkJournalEntryHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const context_id = normalizeRequiredText(body.context_id);
  const date_start = normalizeRequiredDate(body.date_start);
  const date_end = normalizeOptionalDate(body.date_end);
  const topic = normalizeOptionalText(body.topic);
  const input_mode = normalizeInputMode(body.input_mode) ?? "manual";
  const raw_notes = normalizeRequiredText(body.raw_notes);
  const final_text = normalizeRequiredText(body.final_text);
  if (!context_id || !date_start || date_end === undefined || topic === undefined || !raw_notes || !final_text) {
    return validationError("Invalid entry payload");
  }

  return { ok: true, value: { context_id, date_start, date_end, topic, input_mode, raw_notes, final_text } };
}

export function parseUpdateWorkJournalEntryRequest(
  body: unknown
): Result<UpdateWorkJournalEntryHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const updates: UpdateWorkJournalEntryHttpInput = {};
  if (body.context_id !== undefined) {
    const contextId = normalizeRequiredText(body.context_id);
    if (!contextId) return validationError("Context is required");
    updates.context_id = contextId;
  }
  if (body.date_start !== undefined) {
    const date = normalizeRequiredDate(body.date_start);
    if (!date) return validationError("Invalid start date");
    updates.date_start = date;
  }
  if (body.date_end !== undefined) {
    const date = normalizeOptionalDate(body.date_end);
    if (date === undefined) return validationError("Invalid end date");
    updates.date_end = date;
  }
  if (body.topic !== undefined) {
    const topic = normalizeOptionalText(body.topic);
    if (topic === undefined) return validationError("Invalid topic");
    updates.topic = topic;
  }
  if (body.input_mode !== undefined) {
    const mode = normalizeInputMode(body.input_mode);
    if (!mode) return validationError("Invalid input mode");
    updates.input_mode = mode;
  }
  if (body.raw_notes !== undefined) {
    const text = normalizeRequiredText(body.raw_notes);
    if (!text) return validationError("Raw notes are required");
    updates.raw_notes = text;
  }
  if (body.final_text !== undefined) {
    const text = normalizeRequiredText(body.final_text);
    if (!text) return validationError("Final text is required");
    updates.final_text = text;
  }
  return { ok: true, value: updates };
}

export function parseDraftWorkJournalEntryRequest(
  body: unknown
): Result<DraftWorkJournalEntryHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const ai = parseAIRequestConfig(body);
  const contextId = normalizeRequiredText(body.context_id);
  const dateStart = normalizeRequiredDate(body.date_start);
  const dateEnd = normalizeOptionalDate(body.date_end);
  const topic = normalizeOptionalText(body.topic);
  const notes = normalizeRequiredText(body.notes);
  if (!ai.ok) return validationError(ai.message);
  if (!contextId || !dateStart || dateEnd === undefined || topic === undefined || !notes) {
    return validationError("Invalid draft payload");
  }

  return { ok: true, value: { ...ai.value, contextId, dateStart, dateEnd, topic, notes } };
}
import { parseAIRequestConfig, type AIRequestConfig } from "@/app/api/_shared/ai-request";
