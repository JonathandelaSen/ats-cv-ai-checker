"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const basePath = "/interview-questions";
export type InterviewQuestionAnsweredFilter = "all" | "answered" | "empty";

export interface InterviewQuestionsFilters {
  search: string;
  cvId: string | null;
  analysisId: string | null;
  answered: InterviewQuestionAnsweredFilter;
}

function normalizeAnswered(value: string | null): InterviewQuestionAnsweredFilter {
  return value === "answered" || value === "empty" ? value : "all";
}

export function useInterviewQuestionsRouteState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const questionId = pathname.startsWith(`${basePath}/`)
    ? decodeURIComponent(pathname.slice(`${basePath}/`.length).split("/")[0] ?? "") ||
      null
    : null;

  const filters = useMemo<InterviewQuestionsFilters>(
    () => ({
      search: searchParams.get("q") ?? "",
      cvId: searchParams.get("cv"),
      analysisId: searchParams.get("offer"),
      answered: normalizeAnswered(searchParams.get("answered")),
    }),
    [searchParams]
  );

  const hrefFor = useCallback(
    (
      nextQuestionId: string | null,
      nextFilters: Partial<InterviewQuestionsFilters> = {}
    ) => {
      const merged = { ...filters, ...nextFilters };
      const query = new URLSearchParams();
      if (merged.search.trim()) query.set("q", merged.search.trim());
      if (merged.cvId) query.set("cv", merged.cvId);
      if (merged.analysisId) query.set("offer", merged.analysisId);
      if (merged.answered !== "all") query.set("answered", merged.answered);
      const qs = query.toString();
      const path = nextQuestionId
        ? `${basePath}/${encodeURIComponent(nextQuestionId)}`
        : basePath;
      return qs ? `${path}?${qs}` : path;
    },
    [filters]
  );

  const setFilters = useCallback(
    (nextFilters: Partial<InterviewQuestionsFilters>) => {
      window.history.pushState(null, "", hrefFor(questionId, nextFilters));
    },
    [hrefFor, questionId]
  );

  const selectQuestion = useCallback(
    (nextQuestionId: string) => {
      window.history.pushState(null, "", hrefFor(nextQuestionId));
    },
    [hrefFor]
  );

  const replaceQuestion = useCallback(
    (nextQuestionId: string) => {
      window.history.replaceState(null, "", hrefFor(nextQuestionId));
    },
    [hrefFor]
  );

  const clearQuestion = useCallback(() => {
    window.history.replaceState(null, "", hrefFor(null));
  }, [hrefFor]);

  return {
    pathname,
    questionId,
    filters,
    hrefFor,
    setFilters,
    selectQuestion,
    replaceQuestion,
    clearQuestion,
  };
}
