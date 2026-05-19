import type {
  ActivityContextResponse,
  ListActivityContextsResponse,
} from "@/app/api/activity-contexts/responses";
import type {
  WorkJournalContextLegacy,
  WorkJournalEntryInputMode,
  WorkJournalEntryLegacy,
  WorkJournalEntryResponse,
} from "./work-journal-types";
import {
  toWorkJournalEntryLegacy,
} from "./work-journal-types";

interface ErrorResponse {
  error?: string;
}

async function readJsonResponse<T>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as ErrorResponse & T;
  if (!res.ok) throw new Error(data.error || fallbackMessage);
  return data;
}

export interface SaveWorkJournalEntryInput {
  context_id: string;
  date_start: string;
  date_end: string | null;
  topic: string | null;
  input_mode: WorkJournalEntryInputMode;
  raw_notes: string;
  final_text: string;
}

export async function listWorkJournalContexts() {
  const res = await fetch("/api/activity-contexts");
  const data = await readJsonResponse<ListActivityContextsResponse>(
    res,
    "Could not load activity contexts."
  );
  return {
    contexts: data.contexts.map(toWorkJournalContextLegacyFromActivityContext),
    suggestions: [],
  };
}

export async function listWorkJournalEntries() {
  const res = await fetch("/api/work-journal/entries");
  const data = await readJsonResponse<WorkJournalEntryResponse[]>(
    res,
    "Could not load work journal entries."
  );
  return data.map(toWorkJournalEntryLegacy);
}

export async function createWorkJournalEntry(input: SaveWorkJournalEntryInput) {
  const res = await fetch("/api/work-journal/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJsonResponse<WorkJournalEntryResponse>(
    res,
    "Could not save work journal entry."
  );
  return toWorkJournalEntryLegacy(data);
}

export async function draftWorkJournalEntry(input: {
  provider: "gemini" | "mock";
  apiKey?: string;
  model: string;
  context_id: string;
  date_start: string;
  date_end: string | null;
  topic: string | null;
  notes: string;
}) {
  const res = await fetch("/api/work-journal/entries/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJsonResponse<{ finalText: string }>(
    res,
    "Could not draft work journal entry."
  );
}

export async function updateWorkJournalEntry(input: {
  id: string;
  updates: Partial<WorkJournalEntryLegacy>;
}) {
  const res = await fetch(`/api/work-journal/entries/${input.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.updates),
  });
  const data = await readJsonResponse<WorkJournalEntryResponse>(
    res,
    "Could not update work journal entry."
  );
  return toWorkJournalEntryLegacy(data);
}

export async function deleteWorkJournalEntry(id: string) {
  const res = await fetch(`/api/work-journal/entries/${id}`, { method: "DELETE" });
  return readJsonResponse<{ ok: true }>(res, "Could not delete work journal entry.");
}

function toWorkJournalContextLegacyFromActivityContext(
  input: ActivityContextResponse
): WorkJournalContextLegacy {
  return {
    id: input.id,
    user_id: input.userId,
    type: input.type,
    name: input.name,
    role_or_label: null,
    status: input.status,
    is_default: input.isDefault,
    created_from_cv: false,
    created_at: input.createdAt,
    updated_at: input.updatedAt,
  };
}
