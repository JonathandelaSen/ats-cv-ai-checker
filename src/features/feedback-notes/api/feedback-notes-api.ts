import type {
  CreateFeedbackResponse,
  FeedbackResponse,
  ListFeedbacksResponse,
} from "@/app/api/feedback-notes/feedbacks/responses";
import type {
  DeleteFeedbackResponse,
  GetFeedbackResponse,
  UpdateFeedbackResponse,
} from "@/app/api/feedback-notes/feedbacks/[id]/responses";
import type {
  CreateFeedbackEntryResponse,
  FeedbackEntryResponse,
  ListFeedbackEntriesResponse,
} from "@/app/api/feedback-notes/feedbacks/[id]/entries/responses";
import type {
  DeleteFeedbackEntryResponse,
  UpdateFeedbackEntryResponse,
} from "@/app/api/feedback-notes/entries/[id]/responses";
import type { GenerateFinalFeedbackResponse } from "@/app/api/feedback-notes/feedbacks/[id]/generate/responses";
import type { CloseFeedbackResponse } from "@/app/api/feedback-notes/feedbacks/[id]/close/responses";
import type { ReopenFeedbackResponse } from "@/app/api/feedback-notes/feedbacks/[id]/reopen/responses";

export type FeedbackFilter = FeedbackResponse["status"] | "all";
export type FeedbackListItem = ListFeedbacksResponse[number];
export type FeedbackEntry = FeedbackEntryResponse;

async function readJsonResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

export async function listFeedbacks(status: FeedbackFilter) {
  const params = new URLSearchParams({ status });
  const res = await fetch(`/api/feedback-notes/feedbacks?${params.toString()}`);
  return readJsonResponse<ListFeedbacksResponse>(res, "Could not load feedback notes.");
}

export async function getFeedback(feedbackId: string) {
  const res = await fetch(`/api/feedback-notes/feedbacks/${feedbackId}`);
  return readJsonResponse<GetFeedbackResponse>(res, "Could not load feedback note.");
}

export async function createFeedback(input: { personName: string }) {
  const res = await fetch("/api/feedback-notes/feedbacks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJsonResponse<CreateFeedbackResponse>(res, "Could not create feedback note.");
}

export async function updateFeedback(
  feedbackId: string,
  updates: { personName?: string; finalFeedback?: string | null }
) {
  const res = await fetch(`/api/feedback-notes/feedbacks/${feedbackId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return readJsonResponse<UpdateFeedbackResponse>(res, "Could not update feedback note.");
}

export async function deleteFeedback(feedbackId: string) {
  const res = await fetch(`/api/feedback-notes/feedbacks/${feedbackId}`, {
    method: "DELETE",
  });
  return readJsonResponse<DeleteFeedbackResponse>(res, "Could not delete feedback note.");
}

export async function closeFeedback(feedbackId: string) {
  const res = await fetch(`/api/feedback-notes/feedbacks/${feedbackId}/close`, {
    method: "POST",
  });
  return readJsonResponse<CloseFeedbackResponse>(res, "Could not close feedback note.");
}

export async function reopenFeedback(feedbackId: string) {
  const res = await fetch(`/api/feedback-notes/feedbacks/${feedbackId}/reopen`, {
    method: "POST",
  });
  return readJsonResponse<ReopenFeedbackResponse>(res, "Could not reopen feedback note.");
}

export async function listEntries(feedbackId: string) {
  const res = await fetch(`/api/feedback-notes/feedbacks/${feedbackId}/entries`);
  return readJsonResponse<ListFeedbackEntriesResponse>(res, "Could not load feedback entries.");
}

export async function createEntry(feedbackId: string, content: string) {
  const res = await fetch(`/api/feedback-notes/feedbacks/${feedbackId}/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return readJsonResponse<CreateFeedbackEntryResponse>(res, "Could not add feedback entry.");
}

export async function updateEntry(entryId: string, content: string) {
  const res = await fetch(`/api/feedback-notes/entries/${entryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return readJsonResponse<UpdateFeedbackEntryResponse>(res, "Could not update feedback entry.");
}

export async function deleteEntry(entryId: string) {
  const res = await fetch(`/api/feedback-notes/entries/${entryId}`, {
    method: "DELETE",
  });
  return readJsonResponse<DeleteFeedbackEntryResponse>(res, "Could not delete feedback entry.");
}

export async function generateFinalFeedback(
  feedbackId: string,
  input: { provider: "gemini" | "mock";
  apiKey?: string; model: string }
) {
  const res = await fetch(`/api/feedback-notes/feedbacks/${feedbackId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJsonResponse<GenerateFinalFeedbackResponse>(res, "Could not generate feedback.");
}

export interface FeedbackNotesFinalPromptEntry {
  content: string;
  createdAt: string;
}

export function buildFeedbackNotesFinalPrompt(input: {
  personName: string;
  entries: FeedbackNotesFinalPromptEntry[];
}) {
  const entries = input.entries
    .map(
      (entry, index) =>
        `${index + 1}. Date: ${entry.createdAt}\n   Note: ${entry.content}`
    )
    .join("\n\n");

  return `
Write final peer feedback for: ${input.personName}

You help users turn private raw feedback notes into useful peer feedback.
Write in the same language as the notes, using the predominant language when notes are mixed.
Use only the notes provided. Do not invent facts, motivations, outcomes, dates, roles, or impact.
Write specific, constructive, kind, professional feedback that can be used in a real conversation.
Base the feedback on observable behavior. Preserve uncertainty when the notes are uncertain.
If the notes are sparse, keep the output appropriately brief instead of adding filler.

Use these private raw notes as the only source material:

${entries}

Return only the final feedback in plain text.
`.trim();
}
