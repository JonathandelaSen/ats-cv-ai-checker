import type { FeedbackFilter } from "./feedback-notes-api";

export const feedbackNotesQueryKeys = {
  all: ["feedback-notes"] as const,
  lists: () => [...feedbackNotesQueryKeys.all, "list"] as const,
  list: (status: FeedbackFilter) =>
    [...feedbackNotesQueryKeys.lists(), status] as const,
  details: () => [...feedbackNotesQueryKeys.all, "detail"] as const,
  detail: (feedbackId: string | null) =>
    [...feedbackNotesQueryKeys.details(), feedbackId] as const,
  entries: (feedbackId: string | null) =>
    [...feedbackNotesQueryKeys.all, "entries", feedbackId] as const,
};
