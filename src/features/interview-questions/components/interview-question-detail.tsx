"use client";

import { Briefcase, Loader2, Save, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import type {
  InterviewQuestion,
  UpdateInterviewQuestionInput,
} from "../api/interview-questions-api";
import { InterviewQuestionAIPanel } from "./interview-question-ai-panel";
import type {
  InterviewQuestionAnalysisOption,
  InterviewQuestionCVOption,
} from "./interview-questions-types";

interface InterviewQuestionDetailProps {
  question: InterviewQuestion;
  cvs: InterviewQuestionCVOption[];
  analyses: InterviewQuestionAnalysisOption[];
  model: string;
  isSaving: boolean;
  aiLoading: "generate" | "edit" | null;
  hasAIApiKey: boolean;
  onModelChange: (model: string) => void;
  onUpdate: (updates: Partial<UpdateInterviewQuestionInput>) => void;
  onDelete: () => void;
  onRunAI: (mode: "generate" | "edit", instruction: string) => void;
  onOpenSettings: () => void;
  onOpenAnalysis: (id: string) => void;
}

export function InterviewQuestionDetail({
  question,
  cvs,
  analyses,
  model,
  isSaving,
  aiLoading,
  hasAIApiKey,
  onModelChange,
  onUpdate,
  onDelete,
  onRunAI,
  onOpenSettings,
  onOpenAnalysis,
}: InterviewQuestionDetailProps) {
  const t = useTranslations("interviewQuestions");
  const questionRef = useRef<HTMLTextAreaElement | null>(null);
  const contextRef = useRef<HTMLTextAreaElement | null>(null);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);
  const saveButtonClicked = useRef(false);
  const linkedCvName =
    question.cv?.name ??
    cvs.find((cv) => cv.id === question.cvId)?.name ??
    t("noCv");
  const linkedOfferTitle =
    question.analysis?.title ??
    analyses.find((analysis) => analysis.id === question.analysisId)?.title ??
    t("noOffer");
  const markSaveIntent = () => {
    saveButtonClicked.current = true;
  };
  const saveManualDetail = () => {
    onUpdate({
      question: questionRef.current?.value ?? question.question,
      context: contextRef.current?.value || null,
      answer: answerRef.current?.value || null,
    });
    requestAnimationFrame(() => {
      saveButtonClicked.current = false;
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            {t("detail")}
          </p>
          <h2 className="mt-1 text-xl font-bold text-zinc-100">
            {question.question}
          </h2>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <textarea
          ref={questionRef}
          defaultValue={question.question}
          key={`question-${question.id}-${question.updatedAt}`}
          onBlur={(event) =>
            !saveButtonClicked.current &&
            event.target.value.trim() !== question.question &&
            onUpdate({ question: event.target.value })
          }
          className="min-h-24 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40"
        />
        <textarea
          ref={contextRef}
          defaultValue={question.context ?? ""}
          key={`context-${question.id}-${question.updatedAt}`}
          onBlur={(event) =>
            !saveButtonClicked.current &&
            event.target.value !== (question.context ?? "") &&
            onUpdate({ context: event.target.value || null })
          }
          className="min-h-24 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40"
        />
        <textarea
          ref={answerRef}
          defaultValue={question.answer ?? ""}
          key={`answer-${question.id}-${question.updatedAt}`}
          onBlur={(event) =>
            !saveButtonClicked.current &&
            event.target.value !== (question.answer ?? "") &&
            onUpdate({ answer: event.target.value || null })
          }
          className="min-h-52 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2 text-sm leading-6 text-zinc-100 outline-none focus:border-fuchsia-500/40 lg:col-span-2"
        />
        <button
          type="button"
          onMouseDown={markSaveIntent}
          onClick={saveManualDetail}
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white disabled:opacity-50 lg:col-span-2 lg:w-fit"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t("saveManualChanges")}
        </button>
        <div className="rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
            CV
          </p>
          <p className="mt-1 truncate text-sm text-zinc-300">{linkedCvName}</p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
            {t("offer")}
          </p>
          <p className="mt-1 truncate text-sm text-zinc-300">
            {linkedOfferTitle}
          </p>
        </div>
      </div>

      <InterviewQuestionAIPanel
        question={question}
        model={model}
        hasAIApiKey={hasAIApiKey}
        loadingMode={aiLoading}
        onModelChange={onModelChange}
        onRunAI={onRunAI}
        onOpenSettings={onOpenSettings}
      />

      <button
        type="button"
        onClick={() => question.analysisId && onOpenAnalysis(question.analysisId)}
        disabled={!question.analysisId}
        className="inline-flex h-9 items-center gap-2 rounded-lg text-sm font-semibold text-zinc-500 hover:text-emerald-300 disabled:hidden"
      >
        <Briefcase className="h-4 w-4" />
        {t("openLinkedOffer")}
      </button>
      {isSaving && (
        <p className="inline-flex items-center gap-2 text-xs text-zinc-500">
          <Save className="h-3.5 w-3.5" />
          {t("saving")}
        </p>
      )}
    </div>
  );
}
