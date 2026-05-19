"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";
import type { OfferStatus } from "@/lib/analysis-types";
import type { InterviewQuestionSummary } from "../types";
import { AnalysisDetailSkeleton } from "@/components/shared/skeletons";
import {
  useJobMatchAnalysisList,
  useJobMatchAnalysisDetail,
} from "../hooks/use-job-match-analysis-queries";
import { useJobMatchAnalysisMutations } from "../hooks/use-job-match-analysis-mutations";
import { useJobMatchAnalysisRouteState } from "../hooks/use-job-match-analysis-route-state";
import JobMatchAnalysisList from "./job-match-analysis-list";
import JobMatchAnalysisDetail from "./job-match-analysis-detail";
import JobMatchExtractionView from "./job-match-extraction-view";

interface JobMatchAnalysisViewProps {
  aiProvider: "gemini" | "mock";
  aiApiKey: string;
  aiModel: string;
  hasAIApiKey: boolean;
  onOpenSettings: () => void;
  onNewAnalysis: () => void;
  onOpenQuestions?: (options?: {
    cvId?: string | null;
    analysisId?: string | null;
  }) => void;
  interviewQuestions?: InterviewQuestionSummary[];
  onInterviewQuestionCreated?: () => void;
}

export default function JobMatchAnalysisView({
  aiProvider,
  aiApiKey,
  aiModel,
  hasAIApiKey,
  onOpenSettings,
  onNewAnalysis,
  onOpenQuestions,
  interviewQuestions = [],
  onInterviewQuestionCreated,
}: JobMatchAnalysisViewProps) {
  const t = useTranslations("analysisFlow.appShell");
  const routeState = useJobMatchAnalysisRouteState();
  const listQuery = useJobMatchAnalysisList();
  const mutations = useJobMatchAnalysisMutations();

  const {
    analysisId,
    isAnalysisView,
    analysisTab,
    selectAnalysis,
    clearSelection,
    goToAnalysis,
    goToExtraction,
    setAnalysisTab,
  } = routeState;

  const detailQuery = useJobMatchAnalysisDetail(analysisId);
  const analyses = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const detail = detailQuery.data ?? null;

  const handleSelect = (id: string) => {
    selectAnalysis(id);
  };

  const handleBack = () => {
    clearSelection();
  };

  const handleDelete = async (id: string) => {
    await mutations.deleteAnalysis.mutateAsync(id);
    if (analysisId === id) {
      handleBack();
    }
  };

  const handleUpdateUrl = async (url: string) => {
    if (!analysisId) return;
    await mutations.updateAnalysis.mutateAsync({
      id: analysisId,
      updates: { jobUrl: url || null },
    });
  };

  const handleUpdateTracking = async (updates: {
    offerStatus: OfferStatus;
    offerNotes: string;
    offerNextAction: string;
    offerNextActionAt: string;
  }) => {
    if (!analysisId) return;
    await mutations.updateAnalysis.mutateAsync({
      id: analysisId,
      updates: {
        offerStatus: updates.offerStatus,
        offerNotes: updates.offerNotes,
        offerNextAction: updates.offerNextAction,
        offerNextActionAt: updates.offerNextActionAt || null,
      },
    });
  };

  const handleScore = async (input: {
    jobDescription: string;
    jobUrl: string;
    model: string;
  }) => {
    if (!analysisId) return;
    await mutations.scoreAnalysis.mutateAsync({
      id: analysisId,
      input: {
        provider: aiProvider,
        apiKey: aiApiKey,
        model: input.model,
        jobDescription: input.jobDescription,
        jobUrl: input.jobUrl || null,
      },
    });
    goToAnalysis("summary");
  };

  const handleOpenQuestions = () => {
    onOpenQuestions?.({
      cvId: detail?.cvId,
      analysisId: detail?.id,
    });
  };

  const filteredInterviewQuestions = useMemo(
    () =>
      analysisId
        ? interviewQuestions.filter((q) => q.analysisId === analysisId)
        : [],
    [interviewQuestions, analysisId],
  );

  // List view
  if (!analysisId) {
    return (
      <JobMatchAnalysisList
        analyses={analyses}
        onSelect={handleSelect}
        onNewAnalysis={onNewAnalysis}
        onDelete={handleDelete}
        isLoading={listQuery.isLoading}
      />
    );
  }

  // Loading detail
  if (detailQuery.isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <AnalysisDetailSkeleton />
      </div>
    );
  }

  // Detail not found
  if (!detail) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-zinc-600">
          <p>{t("empty")}</p>
        </div>
      </div>
    );
  }

  const hasScore = detail.aiScore !== null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {hasScore && (
        <div className="shrink-0 flex items-center gap-1 px-4 sm:px-6 pt-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all mr-2"
          >
            ← Back
          </button>
          <button
            onClick={goToExtraction}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all
              ${
                !isAnalysisView
                  ? "bg-white/[0.08] text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
              }
            `}
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t("extractionTab")}
          </button>
          <button
            onClick={() => goToAnalysis()}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all
              ${
                isAnalysisView
                  ? "bg-white/[0.08] text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
              }
            `}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t("analysisTab")}
          </button>
        </div>
      )}

      {!hasScore && (
        <div className="shrink-0 flex items-center gap-1 px-4 sm:px-6 pt-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all"
          >
            ← Back
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!isAnalysisView ? (
          <motion.div
            key="extraction-view"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col overflow-hidden min-h-0"
          >
            <JobMatchExtractionView
              analysis={detail}
              onScore={handleScore}
              hasAIApiKey={hasAIApiKey}
              onOpenSettings={onOpenSettings}
            />
          </motion.div>
        ) : hasScore ? (
          <motion.div
            key="analysis-view"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col overflow-hidden min-h-0"
          >
            <JobMatchAnalysisDetail
              analysis={detail}
              aiApiKey={aiApiKey}
              hasAIApiKey={hasAIApiKey}
              activeTab={analysisTab}
              onTabChange={setAnalysisTab}
              interviewQuestions={filteredInterviewQuestions}
              onInterviewQuestionCreated={onInterviewQuestionCreated}
              onOpenQuestions={handleOpenQuestions}
              onUpdateUrl={handleUpdateUrl}
              onUpdateTracking={handleUpdateTracking}
              onDelete={handleDelete}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
