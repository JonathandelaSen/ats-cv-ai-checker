"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getFeedback,
  listEntries,
  listFeedbacks,
  type FeedbackFilter,
} from "../api/feedback-notes-api";
import { feedbackNotesQueryKeys } from "../api/feedback-notes-query-keys";

export function useFeedbackNotesList(status: FeedbackFilter) {
  return useQuery({
    queryKey: feedbackNotesQueryKeys.list(status),
    queryFn: () => listFeedbacks(status),
  });
}

export function useFeedbackNoteDetail(feedbackId: string | null) {
  return useQuery({
    queryKey: feedbackNotesQueryKeys.detail(feedbackId),
    queryFn: () => getFeedback(feedbackId as string),
    enabled: Boolean(feedbackId),
  });
}

export function useFeedbackEntries(feedbackId: string | null) {
  return useQuery({
    queryKey: feedbackNotesQueryKeys.entries(feedbackId),
    queryFn: () => listEntries(feedbackId as string),
    enabled: Boolean(feedbackId),
  });
}
