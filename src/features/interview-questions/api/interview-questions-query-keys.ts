import type { InterviewQuestionsFilters } from "../hooks/use-interview-questions-route-state";

export const interviewQuestionsQueryKeys = {
  all: ["interview-questions"] as const,
  options: () => [...interviewQuestionsQueryKeys.all, "options"] as const,
  lists: () => [...interviewQuestionsQueryKeys.all, "list"] as const,
  list: (filters: InterviewQuestionsFilters) =>
    [...interviewQuestionsQueryKeys.lists(), filters] as const,
  details: () => [...interviewQuestionsQueryKeys.all, "detail"] as const,
  detail: (id: string | null) =>
    [...interviewQuestionsQueryKeys.details(), id] as const,
};
