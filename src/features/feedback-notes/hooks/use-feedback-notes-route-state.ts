"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { FeedbackFilter } from "../api/feedback-notes-api";

function normalizeStatus(value: string | null): FeedbackFilter {
  return value === "closed" || value === "all" ? value : "active";
}

export function useFeedbackNotesRouteState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const status = normalizeStatus(searchParams.get("status"));
  const feedbackId = pathname.startsWith("/feedback-notes/")
    ? decodeURIComponent(pathname.slice("/feedback-notes/".length).split("/")[0] ?? "") || null
    : null;

  const hrefFor = useCallback((nextFeedbackId: string | null, nextStatus = status) => {
    const query = new URLSearchParams({ status: nextStatus });
    return nextFeedbackId
      ? `/feedback-notes/${encodeURIComponent(nextFeedbackId)}?${query.toString()}`
      : `/feedback-notes?${query.toString()}`;
  }, [status]);

  const setStatus = useCallback(
    (nextStatus: FeedbackFilter) => {
      window.history.pushState(null, "", hrefFor(feedbackId, nextStatus));
    },
    [feedbackId, hrefFor]
  );

  const selectFeedback = useCallback(
    (nextFeedbackId: string) => {
      window.history.pushState(null, "", hrefFor(nextFeedbackId));
    },
    [hrefFor]
  );

  const replaceFeedback = useCallback(
    (nextFeedbackId: string) => {
      window.history.replaceState(null, "", hrefFor(nextFeedbackId));
    },
    [hrefFor]
  );

  const clearSelection = useCallback(() => {
    window.history.replaceState(null, "", hrefFor(null));
  }, [hrefFor]);

  return {
    feedbackId,
    status,
    pathname,
    setStatus,
    selectFeedback,
    replaceFeedback,
    clearSelection,
  };
}
