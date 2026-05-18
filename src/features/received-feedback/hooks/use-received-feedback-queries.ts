"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listActivityContexts,
  listReceivedFeedback,
} from "../api/received-feedback-api";
import { receivedFeedbackQueryKeys } from "../api/received-feedback-query-keys";

export function useReceivedFeedbackList() {
  return useQuery({
    queryKey: receivedFeedbackQueryKeys.feedback(),
    queryFn: listReceivedFeedback,
  });
}

export function useReceivedFeedbackContexts() {
  return useQuery({
    queryKey: receivedFeedbackQueryKeys.contexts(),
    queryFn: listActivityContexts,
  });
}
