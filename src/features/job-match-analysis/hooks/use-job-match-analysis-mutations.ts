"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  JobMatchAnalysisSummary,
  UpdateJobMatchAnalysisInput,
  ScoreJobMatchAnalysisInput,
  JobMatchAnalysisDetail,
} from "../api/job-match-analysis-api";
import {
  deleteJobMatchAnalysis,
  scoreJobMatchAnalysis,
  updateJobMatchAnalysis,
} from "../api/job-match-analysis-api";
import { jobMatchAnalysisQueryKeys } from "../api/job-match-analysis-query-keys";
import type { ListJobMatchAnalysesResponse } from "@/app/api/job-match-analyses/responses";

interface OptimisticContext {
  previousList?: ListJobMatchAnalysesResponse;
  previousDetail?: JobMatchAnalysisDetail;
}

export function useJobMatchAnalysisMutations() {
  const queryClient = useQueryClient();
  const listKey = jobMatchAnalysisQueryKeys.lists();

  const startOptimisticUpdate = async (id?: string) => {
    await queryClient.cancelQueries({ queryKey: listKey });
    if (id) {
      await queryClient.cancelQueries({
        queryKey: jobMatchAnalysisQueryKeys.detail(id),
      });
    }
    return {
      previousList:
        queryClient.getQueryData<ListJobMatchAnalysesResponse>(listKey),
      previousDetail: id
        ? queryClient.getQueryData<JobMatchAnalysisDetail>(
            jobMatchAnalysisQueryKeys.detail(id)
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
        jobMatchAnalysisQueryKeys.detail(context.previousDetail.id),
        context.previousDetail
      );
    }
  };

  return {
    deleteAnalysis: useMutation({
      mutationFn: deleteJobMatchAnalysis,
      onMutate: async (id) => {
        const context = await startOptimisticUpdate(id);
        queryClient.setQueryData<ListJobMatchAnalysesResponse>(
          listKey,
          (current) => current?.filter((item) => item.id !== id) ?? current
        );
        queryClient.removeQueries({
          queryKey: jobMatchAnalysisQueryKeys.detail(id),
        });
        return context;
      },
      onError: (_error, _variables, context) => rollback(context),
    }),

    updateAnalysis: useMutation({
      mutationFn: ({
        id,
        updates,
      }: {
        id: string;
        updates: UpdateJobMatchAnalysisInput;
      }) => updateJobMatchAnalysis({ id, updates }),
      onSuccess: (detail) => {
        queryClient.setQueryData(
          jobMatchAnalysisQueryKeys.detail(detail.id),
          detail
        );
        queryClient.setQueryData<ListJobMatchAnalysesResponse>(
          listKey,
          (current) =>
            current?.map((item) =>
              item.id === detail.id
                ? {
                    ...item,
                    offerStatus: detail.offerStatus,
                    offerNextActionAt: detail.offerNextActionAt,
                    jobUrl: detail.jobUrl,
                  }
                : item
            ) ?? current
        );
      },
    }),

    scoreAnalysis: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: ScoreJobMatchAnalysisInput;
      }) => scoreJobMatchAnalysis({ id, input }),
      onSuccess: (detail) => {
        queryClient.setQueryData(
          jobMatchAnalysisQueryKeys.detail(detail.id),
          detail
        );
        queryClient.setQueryData<ListJobMatchAnalysesResponse>(
          listKey,
          (current) =>
            current?.map((item) =>
              item.id === detail.id
                ? {
                    ...item,
                    aiScore: detail.aiScore,
                    aiAnalyzedAt: detail.aiAnalyzedAt,
                  }
                : item
            ) ?? current
        );
      },
    }),
  };
}
