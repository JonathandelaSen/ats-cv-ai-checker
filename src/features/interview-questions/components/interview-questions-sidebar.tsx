"use client";

import { MessageSquareQuote } from "lucide-react";
import { useTranslations } from "next-intl";
import type { InterviewQuestion } from "../api/interview-questions-api";
import type {
  InterviewQuestionAnsweredFilter,
  InterviewQuestionsFilters,
} from "../hooks/use-interview-questions-route-state";
import { InterviewQuestionListItem } from "./interview-question-list-item";
import type {
  InterviewQuestionAnalysisOption,
  InterviewQuestionCVOption,
} from "./interview-questions-types";

interface InterviewQuestionsSidebarProps {
  questions: InterviewQuestion[];
  selectedId: string | null;
  filters: InterviewQuestionsFilters;
  cvs: InterviewQuestionCVOption[];
  analyses: InterviewQuestionAnalysisOption[];
  onSelect: (id: string) => void;
  onFiltersChange: (filters: Partial<InterviewQuestionsFilters>) => void;
}

export function InterviewQuestionsSidebar({
  questions,
  selectedId,
  filters,
  cvs,
  analyses,
  onSelect,
  onFiltersChange,
}: InterviewQuestionsSidebarProps) {
  const t = useTranslations("interviewQuestions");
  return (
    <section className="flex min-h-0 flex-col">
      <div className="mb-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filters.cvId ?? ""}
            onChange={(event) =>
              onFiltersChange({ cvId: event.target.value || null })
            }
            className="h-9 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-2 text-xs text-zinc-300 outline-none"
          >
            <option value="">{t("allCvs")}</option>
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.name}
              </option>
            ))}
          </select>
          <select
            value={filters.analysisId ?? ""}
            onChange={(event) =>
              onFiltersChange({ analysisId: event.target.value || null })
            }
            className="h-9 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-2 text-xs text-zinc-300 outline-none"
          >
            <option value="">{t("allOffers")}</option>
            {analyses.map((analysis) => (
              <option key={analysis.id} value={analysis.id}>
                {analysis.title}
              </option>
            ))}
          </select>
        </div>
        <select
          value={filters.answered}
          onChange={(event) =>
            onFiltersChange({
              answered: event.target.value as InterviewQuestionAnsweredFilter,
            })
          }
          className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0a0a12] px-2 text-xs text-zinc-300 outline-none"
        >
          <option value="all">{t("all")}</option>
          <option value="answered">{t("answeredFilter")}</option>
          <option value="empty">{t("pendingFilter")}</option>
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
        {questions.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-zinc-600">
            <MessageSquareQuote className="mb-3 h-8 w-8" />
            {t("emptyFiltered")}
          </div>
        ) : (
          questions.map((question) => (
            <InterviewQuestionListItem
              key={question.id}
              question={question}
              isSelected={selectedId === question.id}
              onSelect={() => onSelect(question.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
