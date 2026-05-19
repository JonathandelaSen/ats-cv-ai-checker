"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createActivityContext,
  deleteActivityContext,
  handleActivityContextSuggestion,
  listActivityContexts,
  updateActivityContext,
} from "../api/activity-context-api";
import { activityContextQueryKeys } from "../api/activity-context-query-keys";

export function useActivityContexts() {
  return useQuery({
    queryKey: activityContextQueryKeys.lists(),
    queryFn: listActivityContexts,
  });
}

export function useActivityContextMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: activityContextQueryKeys.all });

  return {
    create: useMutation({
      mutationFn: createActivityContext,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: updateActivityContext,
      onSuccess: invalidate,
    }),
    delete: useMutation({
      mutationFn: deleteActivityContext,
      onSuccess: invalidate,
    }),
    suggestion: useMutation({
      mutationFn: handleActivityContextSuggestion,
      onSuccess: invalidate,
    }),
  };
}
