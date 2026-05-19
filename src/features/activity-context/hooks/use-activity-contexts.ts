"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createActivityContext,
  deleteActivityContext,
  handleActivityContextSuggestion,
  listActivityContexts,
  updateActivityContext,
} from "../api/activity-context-api";
import type {
  ActivityContext,
  ActivityContextSuggestion,
  ActivityContextType,
  CreateActivityContextInput,
  UpdateActivityContextInput,
} from "../api/activity-context-api";
import { activityContextQueryKeys } from "../api/activity-context-query-keys";
import { getErrorMessage } from "@/lib/errors";

export function useActivityContexts() {
  return useQuery({
    queryKey: activityContextQueryKeys.lists(),
    queryFn: listActivityContexts,
  });
}

export function useCreateActivityContext() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createActivityContext,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: activityContextQueryKeys.all }),
  });

  const create = useCallback(
    async (input: CreateActivityContextInput) => {
      setError(null);
      try {
        return await mutation.mutateAsync(input);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        return null;
      }
    },
    [mutation]
  );

  return { create, isPending: mutation.isPending, error, clearError: () => setError(null) };
}

export function useUpdateActivityContext() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: updateActivityContext,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: activityContextQueryKeys.all }),
  });

  const update = useCallback(
    async (id: string, updates: UpdateActivityContextInput) => {
      setError(null);
      try {
        return await mutation.mutateAsync({ id, updates });
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        return null;
      }
    },
    [mutation]
  );

  return { update, isPending: mutation.isPending, error, clearError: () => setError(null) };
}

export function useDeleteActivityContext() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: deleteActivityContext,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: activityContextQueryKeys.all }),
  });

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      try {
        return await mutation.mutateAsync(id);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        return null;
      }
    },
    [mutation]
  );

  return { remove, isPending: mutation.isPending, error, clearError: () => setError(null) };
}

export function useHandleActivityContextSuggestion() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: handleActivityContextSuggestion,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: activityContextQueryKeys.all }),
  });

  const promote = useCallback(
    async (suggestion: ActivityContextSuggestion) => {
      setError(null);
      try {
        return await mutation.mutateAsync({ ...suggestion, action: "promote" });
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        return null;
      }
    },
    [mutation]
  );

  const hide = useCallback(
    async (suggestion: ActivityContextSuggestion) => {
      setError(null);
      try {
        await mutation.mutateAsync({ ...suggestion, action: "hide" });
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      }
    },
    [mutation]
  );

  return { promote, hide, isPending: mutation.isPending, error, clearError: () => setError(null) };
}

export type { ActivityContext, ActivityContextSuggestion, ActivityContextType };
