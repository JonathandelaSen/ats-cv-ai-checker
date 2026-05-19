export const jobMatchAnalysisQueryKeys = {
  all: ["job-match-analyses"] as const,
  lists: () => [...jobMatchAnalysisQueryKeys.all, "list"] as const,
  details: () => [...jobMatchAnalysisQueryKeys.all, "detail"] as const,
  detail: (id: string | null) =>
    [...jobMatchAnalysisQueryKeys.details(), id] as const,
};
