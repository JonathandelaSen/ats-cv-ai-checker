"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { getErrorMessage } from "@/lib/errors";
import type {
  InterviewQuestion,
  UpdateInterviewQuestionInput,
} from "../api/interview-questions-api";
import { useInterviewQuestionsMutations } from "../hooks/use-interview-questions-mutations";
import {
  useInterviewQuestionDetail,
  useInterviewQuestionOptions,
  useInterviewQuestionsList,
} from "../hooks/use-interview-questions-queries";
import { useInterviewQuestionsRouteState } from "../hooks/use-interview-questions-route-state";
import { InterviewQuestionDetail } from "./interview-question-detail";
import { InterviewQuestionsSidebar } from "./interview-questions-sidebar";
import { InterviewQuestionsSkeleton } from "./interview-questions-skeleton";

interface InterviewQuestionsViewProps {
  aiProvider: "gemini" | "mock";
  aiApiKey: string;
  aiModel: string;
  hasAIApiKey: boolean;
  onOpenSettings: () => void;
  onOpenAnalysis: (id: string) => void;
}

export default function InterviewQuestionsView({
  aiProvider,
  aiApiKey,
  aiModel,
  hasAIApiKey,
  onOpenSettings,
  onOpenAnalysis,
}: InterviewQuestionsViewProps) {
  const t = useTranslations("interviewQuestions");
  const routeState = useInterviewQuestionsRouteState();
  const {
    questionId,
    filters,
    setFilters,
    selectQuestion,
    replaceQuestion,
    clearQuestion,
  } = routeState;
  const listQuery = useInterviewQuestionsList(filters);
  const detailQuery = useInterviewQuestionDetail(questionId);
  const optionsQuery = useInterviewQuestionOptions();
  const mutations = useInterviewQuestionsMutations(filters);
  const [model, setModel] = useState("gemini-3.1-pro-preview");
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const cvs = optionsQuery.data?.cvs ?? [];
  const analyses = optionsQuery.data?.analyses ?? [];
  const selectedFromList =
    questions.find((question) => question.id === questionId) ?? null;
  const selected = detailQuery.data ?? selectedFromList;
  const isSaving =
    mutations.updateQuestion.isPending ||
    mutations.deleteQuestion.isPending;
  const aiLoading = mutations.generateAnswer.isPending
    ? "generate"
    : mutations.editAnswer.isPending
      ? "edit"
      : null;

  useEffect(() => {
    if (!questionId && questions[0]?.id) {
      replaceQuestion(questions[0].id);
    }
  }, [questions, questionId, replaceQuestion]);

  const setMutationError = (err: unknown) => setError(getErrorMessage(err));

  const updateQuestion = async (updates: Partial<UpdateInterviewQuestionInput>) => {
    if (!selected) return;
    setError(null);
    try {
      await mutations.updateQuestion.mutateAsync({ id: selected.id, updates });
    } catch (err: unknown) {
      setMutationError(err);
    }
  };

  const deleteQuestion = async () => {
    if (!selected) return;
    if (!confirm(t("errors.confirmDelete"))) return;
    const selectedIndex = questions.findIndex((item) => item.id === selected.id);
    const nextSelection =
      questions[selectedIndex + 1]?.id ?? questions[selectedIndex - 1]?.id ?? null;
    setError(null);
    if (nextSelection) replaceQuestion(nextSelection);
    else clearQuestion();
    try {
      await mutations.deleteQuestion.mutateAsync(selected.id);
    } catch (err: unknown) {
      replaceQuestion(selected.id);
      setMutationError(err);
    }
  };

  const runAI = async (mode: "generate" | "edit", instruction: string) => {
    if (!selected) return;
    if (!hasAIApiKey) {
      onOpenSettings();
      return;
    }
    setError(null);
    try {
      const result = await (mode === "generate"
        ? mutations.generateAnswer.mutateAsync({
            id: selected.id,
            input: {
              provider: aiProvider,
              apiKey: aiApiKey,
              model: aiModel,
              context: selected.context,
              cvId: selected.cvId,
              analysisId: selected.analysisId,
            },
          })
        : mutations.editAnswer.mutateAsync({
            id: selected.id,
            input: {
              provider: aiProvider,
              apiKey: aiApiKey,
              model: aiModel,
              context: selected.context,
              instruction,
              cvId: selected.cvId,
              analysisId: selected.analysisId,
            },
          }));
      if (result) replaceQuestion(result.id);
    } catch (err: unknown) {
      setMutationError(err);
    }
  };

  if (listQuery.isLoading && questions.length === 0) {
    return <InterviewQuestionsSkeleton />;
  }

  return (
    <div className="flex-1 overflow-hidden p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid h-full w-full gap-6 xl:grid-cols-[380px_1fr]"
      >
        <InterviewQuestionsSidebar
          questions={questions}
          selectedId={questionId}
          filters={filters}
          cvs={cvs}
          analyses={analyses}
          onSelect={selectQuestion}
          onFiltersChange={setFilters}
        />

        <section className="min-h-0 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
          {error && (
            <div className="m-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {selected ? (
            <InterviewQuestionDetail
              question={selected as InterviewQuestion}
              cvs={cvs}
              analyses={analyses}
              model={model}
              isSaving={isSaving}
              aiLoading={aiLoading}
              hasAIApiKey={hasAIApiKey}
              onModelChange={setModel}
              onUpdate={updateQuestion}
              onDelete={deleteQuestion}
              onRunAI={runAI}
              onOpenSettings={onOpenSettings}
              onOpenAnalysis={onOpenAnalysis}
            />
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-zinc-600">
              {t("selectQuestion")}
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
}
