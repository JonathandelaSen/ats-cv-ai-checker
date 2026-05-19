"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getJobMatchAnalysis,
  listJobMatchAnalyses,
} from "../api/job-match-analysis-api";
import { jobMatchAnalysisQueryKeys } from "../api/job-match-analysis-query-keys";

export function useJobMatchAnalysisList() {
  return useQuery({
    queryKey: jobMatchAnalysisQueryKeys.lists(),
    queryFn: listJobMatchAnalyses,
  });
}

export function useJobMatchAnalysisDetail(id: string | null) {
  return useQuery({
    queryKey: jobMatchAnalysisQueryKeys.detail(id),
    queryFn: () => getJobMatchAnalysis(id as string),
    enabled: Boolean(id),
  });
}
