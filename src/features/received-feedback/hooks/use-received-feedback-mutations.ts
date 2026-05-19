"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
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
