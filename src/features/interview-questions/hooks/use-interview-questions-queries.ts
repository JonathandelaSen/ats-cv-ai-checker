"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getInterviewQuestionOptions,
  getInterviewQuestion,
  listInterviewQuestions,
} from "../api/interview-questions-api";
import { interviewQuestionsQueryKeys } from "../api/interview-questions-query-keys";
import type { InterviewQuestionsFilters } from "./use-interview-questions-route-state";

export function useInterviewQuestionsList(filters: InterviewQuestionsFilters) {
  return useQuery({
    queryKey: interviewQuestionsQueryKeys.list(filters),
    queryFn: () => listInterviewQuestions(filters),
  });
}

export function useInterviewQuestionOptions() {
  return useQuery({
    queryKey: interviewQuestionsQueryKeys.options(),
    queryFn: getInterviewQuestionOptions,
  });
}

export function useInterviewQuestionDetail(id: string | null) {
  return useQuery({
    queryKey: interviewQuestionsQueryKeys.detail(id),
    queryFn: () => getInterviewQuestion(id as string),
    enabled: Boolean(id),
  });
}
