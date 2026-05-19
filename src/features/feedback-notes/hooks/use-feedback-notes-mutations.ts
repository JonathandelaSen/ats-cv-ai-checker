"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  closeFeedback,
  createEntry,
  createFeedback,
  deleteEntry,
  deleteFeedback,
  generateFinalFeedback,
  reopenFeedback,
  updateEntry,
  updateFeedback,
  type FeedbackFilter,
} from "../api/feedback-notes-api";
import { feedbackNotesQueryKeys } from "../api/feedback-notes-query-keys";

export function useFeedbackNotesMutations(status: FeedbackFilter) {
  const queryClient = useQueryClient();

  const invalidateFeedbacks = async (feedbackId?: string | null) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: feedbackNotesQueryKeys.lists() }),
      feedbackId
        ? queryClient.invalidateQueries({
            queryKey: feedbackNotesQueryKeys.detail(feedbackId),
          })
        : Promise.resolve(),
      feedbackId
        ? queryClient.invalidateQueries({
            queryKey: feedbackNotesQueryKeys.entries(feedbackId),
          })
        : Promise.resolve(),
    ]);
  };

  return {
    createFeedback: useMutation({
      mutationFn: createFeedback,
      onSuccess: async (feedback) => {
        queryClient.setQueryData(feedbackNotesQueryKeys.detail(feedback.id), feedback);
        await invalidateFeedbacks(feedback.id);
      },
    }),
    updateFeedback: useMutation({
      mutationFn: ({
        feedbackId,
        updates,
      }: {
        feedbackId: string;
        updates: { personName?: string; finalFeedback?: string | null };
      }) => updateFeedback(feedbackId, updates),
      onSuccess: async (feedback) => {
        queryClient.setQueryData(feedbackNotesQueryKeys.detail(feedback.id), feedback);
        await invalidateFeedbacks(feedback.id);
      },
    }),
    deleteFeedback: useMutation({
      mutationFn: deleteFeedback,
      onSuccess: async (_result, feedbackId) => {
        queryClient.removeQueries({
          queryKey: feedbackNotesQueryKeys.detail(feedbackId),
        });
        await invalidateFeedbacks(null);
      },
    }),
    closeFeedback: useMutation({
      mutationFn: closeFeedback,
      onSuccess: async (feedback) => {
        queryClient.setQueryData(feedbackNotesQueryKeys.detail(feedback.id), feedback);
        await invalidateFeedbacks(feedback.id);
      },
    }),
    reopenFeedback: useMutation({
      mutationFn: reopenFeedback,
      onSuccess: async (feedback) => {
        queryClient.setQueryData(feedbackNotesQueryKeys.detail(feedback.id), feedback);
        await invalidateFeedbacks(feedback.id);
      },
    }),
    createEntry: useMutation({
      mutationFn: ({ feedbackId, content }: { feedbackId: string; content: string }) =>
        createEntry(feedbackId, content),
      onSuccess: async (entry) => {
        await invalidateFeedbacks(entry.feedbackId);
      },
    }),
    updateEntry: useMutation({
      mutationFn: ({ entryId, content }: { entryId: string; content: string }) =>
        updateEntry(entryId, content),
      onSuccess: async (entry) => {
        await invalidateFeedbacks(entry.feedbackId);
      },
    }),
    deleteEntry: useMutation({
      mutationFn: ({
        entryId,
        feedbackId,
      }: {
        entryId: string;
        feedbackId: string;
      }) => deleteEntry(entryId).then((result) => ({ result, feedbackId })),
      onSuccess: async ({ feedbackId }) => {
        await invalidateFeedbacks(feedbackId);
      },
    }),
    generateFinalFeedback: useMutation({
      mutationFn: ({
        feedbackId,
        provider,
        apiKey,
        model,
      }: {
        feedbackId: string;
        provider: "gemini" | "mock";
        apiKey?: string;
        model: string;
      }) => generateFinalFeedback(feedbackId, { provider, apiKey, model }),
      onSuccess: async (feedback) => {
        queryClient.setQueryData(feedbackNotesQueryKeys.detail(feedback.id), feedback);
        await invalidateFeedbacks(feedback.id);
      },
    }),
    refresh: () =>
      queryClient.invalidateQueries({
        queryKey: feedbackNotesQueryKeys.list(status),
      }),
  };
}
