"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type AnalysisTab = "summary" | "offer" | "questions" | "chat" | "tracking";

const VALID_TABS: AnalysisTab[] = ["summary", "offer", "questions", "chat", "tracking"];

function normalizeTab(value: string | null): AnalysisTab {
  return VALID_TABS.includes(value as AnalysisTab)
    ? (value as AnalysisTab)
    : "summary";
}

export function useJobMatchAnalysisRouteState() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse: /job-analyses / [id] / analysis
  const segments = pathname.startsWith("/job-analyses/")
    ? pathname.slice("/job-analyses/".length).split("/").map(decodeURIComponent)
    : [];

  const analysisId = segments[0] || null;
  const isAnalysisView = segments[1] === "analysis";
  const analysisTab = normalizeTab(searchParams.get("tab"));

  const hrefFor = useCallback(
    (
      nextId: string | null,
      analysis = false,
      tab: AnalysisTab = "summary",
    ) => {
      if (!nextId) return "/job-analyses";
      const encodedId = encodeURIComponent(nextId);
      if (!analysis) return `/job-analyses/${encodedId}`;
      if (tab === "summary") return `/job-analyses/${encodedId}/analysis`;
      return `/job-analyses/${encodedId}/analysis?tab=${tab}`;
    },
    [],
  );

  const selectAnalysis = useCallback(
    (id: string) => {
      window.history.pushState(null, "", hrefFor(id));
    },
    [hrefFor],
  );

  const replaceAnalysis = useCallback(
    (id: string) => {
      window.history.replaceState(null, "", hrefFor(id));
    },
    [hrefFor],
  );

  const clearSelection = useCallback(() => {
    window.history.replaceState(null, "", "/job-analyses");
  }, []);

  const goToAnalysis = useCallback(
    (tab: AnalysisTab = "summary") => {
      if (!analysisId) return;
      window.history.pushState(null, "", hrefFor(analysisId, true, tab));
    },
    [hrefFor, analysisId],
  );

  const goToExtraction = useCallback(() => {
    if (!analysisId) return;
    window.history.pushState(null, "", hrefFor(analysisId));
  }, [hrefFor, analysisId]);

  const setAnalysisTab = useCallback(
    (tab: AnalysisTab) => {
      if (!analysisId) return;
      window.history.pushState(null, "", hrefFor(analysisId, true, tab));
    },
    [hrefFor, analysisId],
  );

  return {
    analysisId,
    isAnalysisView,
    analysisTab,
    pathname,
    hrefFor,
    selectAnalysis,
    replaceAnalysis,
    clearSelection,
    goToAnalysis,
    goToExtraction,
    setAnalysisTab,
  };
}
