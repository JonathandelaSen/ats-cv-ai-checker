"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type InterviewQuestion,
  type RunInterviewQuestionAIInput,
  type UpdateInterviewQuestionInput,
  deleteInterviewQuestion,
  editInterviewQuestionAnswer,
  generateInterviewQuestionAnswer,
  updateInterviewQuestion,
} from "../api/interview-questions-api";
import { interviewQuestionsQueryKeys } from "../api/interview-questions-query-keys";
import type { InterviewQuestionsFilters } from "./use-interview-questions-route-state";
import type { ListInterviewQuestionsResponse } from "@/app/api/interview-questions/responses";

interface OptimisticContext {
  previousList?: ListInterviewQuestionsResponse;
  previousDetail?: InterviewQuestion;
}

function now() {
  return new Date().toISOString();
}

function replaceQuestion(
  questions: ListInterviewQuestionsResponse | undefined,
  question: InterviewQuestion,
  matchId = question.id
) {
  if (!questions) return questions;
  return questions.map((item) => (item.id === matchId ? question : item));
}

function updateQuestion(
  questions: ListInterviewQuestionsResponse | undefined,
  id: string,
  updates: Partial<UpdateInterviewQuestionInput>
) {
  if (!questions) return questions;
  return questions.map((item) =>
    item.id === id ? { ...item, ...updates, updatedAt: now() } : item
  );
}

export function useInterviewQuestionsMutations(filters: InterviewQuestionsFilters) {
  const queryClient = useQueryClient();
  const listKey = interviewQuestionsQueryKeys.list(filters);

  const getList = () =>
    queryClient.getQueryData<ListInterviewQuestionsResponse>(listKey);

  const startOptimisticUpdate = async (id?: string) => {
    await queryClient.cancelQueries({ queryKey: listKey });
    if (id) {
      await queryClient.cancelQueries({
        queryKey: interviewQuestionsQueryKeys.detail(id),
      });
    }
    return {
      previousList: getList(),
      previousDetail: id
        ? queryClient.getQueryData<InterviewQuestion>(
            interviewQuestionsQueryKeys.detail(id)
          )
        : undefined,
    };
  };

  const rollback = (context: OptimisticContext | undefined) => {
    if (context?.previousList) {
      queryClient.setQueryData(listKey, context.previousList);
    }
    if (context?.previousDetail) {
      queryClient.setQueryData(
        interviewQuestionsQueryKeys.detail(context.previousDetail.id),
        context.previousDetail
      );
    }
  };

  return {
    updateQuestion: useMutation({
      mutationFn: ({
        id,
        updates,
      }: {
        id: string;
        updates: Partial<UpdateInterviewQuestionInput>;
      }) => updateInterviewQuestion({ id, updates }),
      onMutate: async ({ id, updates }) => {
        const context = await startOptimisticUpdate(id);
        queryClient.setQueryData<ListInterviewQuestionsResponse>(listKey, (current) =>
          updateQuestion(current, id, updates)
        );
        queryClient.setQueryData<InterviewQuestion>(
          interviewQuestionsQueryKeys.detail(id),
          (current) => (current ? { ...current, ...updates, updatedAt: now() } : current)
        );
        return context;
      },
      onError: (_error, _variables, context) => rollback(context),
      onSuccess: (question) => {
        queryClient.setQueryData<ListInterviewQuestionsResponse>(listKey, (current) =>
          replaceQuestion(current, question)
        );
        queryClient.setQueryData(interviewQuestionsQueryKeys.detail(question.id), question);
      },
    }),
    deleteQuestion: useMutation({
      mutationFn: deleteInterviewQuestion,
      onMutate: async (id) => {
        const context = await startOptimisticUpdate(id);
        queryClient.setQueryData<ListInterviewQuestionsResponse>(listKey, (current) =>
          current?.filter((item) => item.id !== id) ?? current
        );
        queryClient.removeQueries({ queryKey: interviewQuestionsQueryKeys.detail(id) });
        return context;
      },
      onError: (_error, _variables, context) => rollback(context),
    }),
    generateAnswer: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: RunInterviewQuestionAIInput;
      }) => generateInterviewQuestionAnswer({ id, input }),
      onSuccess: (question) => {
        if (!question) return;
        queryClient.setQueryData<ListInterviewQuestionsResponse>(listKey, (current) =>
          replaceQuestion(current, question)
        );
        queryClient.setQueryData(interviewQuestionsQueryKeys.detail(question.id), question);
      },
    }),
    editAnswer: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: RunInterviewQuestionAIInput;
      }) => editInterviewQuestionAnswer({ id, input }),
      onSuccess: (question) => {
        if (!question) return;
        queryClient.setQueryData<ListInterviewQuestionsResponse>(listKey, (current) =>
          replaceQuestion(current, question)
        );
        queryClient.setQueryData(interviewQuestionsQueryKeys.detail(question.id), question);
      },
    }),
  };
}
