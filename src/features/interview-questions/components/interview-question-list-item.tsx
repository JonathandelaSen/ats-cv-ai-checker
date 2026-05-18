"use client";

import { Briefcase, CheckCircle2, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import type { InterviewQuestion } from "../api/interview-questions-api";

interface InterviewQuestionListItemProps {
  question: InterviewQuestion;
  isSelected: boolean;
  onSelect: () => void;
}

export function InterviewQuestionListItem({
  question,
  isSelected,
  onSelect,
}: InterviewQuestionListItemProps) {
  const t = useTranslations("interviewQuestions");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mb-1 block w-full rounded-lg border p-3 text-left transition-colors ${
        isSelected
          ? "border-fuchsia-500/30 bg-fuchsia-500/10"
          : "border-transparent hover:bg-white/[0.04]"
      }`}
    >
      <p className="line-clamp-2 text-sm font-semibold text-zinc-100">
        {question.question}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {question.answer ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            {t("answered")}
          </span>
        ) : (
          <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            {t("pending")}
          </span>
        )}
        {question.cv && (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
            <FileText className="h-3 w-3" />
            {question.cv.name}
          </span>
        )}
        {question.analysis && (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            <Briefcase className="h-3 w-3" />
            {t("offer")}
          </span>
        )}
      </div>
    </button>
  );
}
