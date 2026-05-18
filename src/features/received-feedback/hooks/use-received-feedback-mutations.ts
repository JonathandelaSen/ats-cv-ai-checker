"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createActivityContext,
  createReceivedFeedback,
  deleteReceivedFeedback,
  updateReceivedFeedback,
} from "../api/received-feedback-api";
import { receivedFeedbackQueryKeys } from "../api/received-feedback-query-keys";

export function useReceivedFeedbackMutations() {
  const queryClient = useQueryClient();

  const invalidateFeedback = async () => {
    await queryClient.invalidateQueries({
      queryKey: receivedFeedbackQueryKeys.all,
    });
  };

  return {
    createContext: useMutation({
      mutationFn: createActivityContext,
      onSuccess: async () => {
        await invalidateFeedback();
      },
    }),
    createFeedback: useMutation({
      mutationFn: createReceivedFeedback,
      onSuccess: async () => {
        await invalidateFeedback();
      },
    }),
    updateFeedback: useMutation({
      mutationFn: updateReceivedFeedback,
      onSuccess: async () => {
        await invalidateFeedback();
      },
    }),
    deleteFeedback: useMutation({
      mutationFn: deleteReceivedFeedback,
      onSuccess: async () => {
        await invalidateFeedback();
      },
    }),
  };
}
