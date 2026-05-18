"use client";

import { Loader2, Pencil, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { InterviewQuestion } from "../api/interview-questions-api";

interface InterviewQuestionAIPanelProps {
  question: InterviewQuestion;
  model: string;
  hasGeminiApiKey: boolean;
  loadingMode: "generate" | "edit" | null;
  onModelChange: (model: string) => void;
  onRunAI: (mode: "generate" | "edit", instruction: string) => void;
  onOpenSettings: () => void;
}

export function InterviewQuestionAIPanel({
  question,
  model,
  hasGeminiApiKey,
  loadingMode,
  onModelChange,
  onRunAI,
  onOpenSettings,
}: InterviewQuestionAIPanelProps) {
  const t = useTranslations("interviewQuestions");
  const [instruction, setInstruction] = useState("");
  const disabled = loadingMode !== null;

  const runEdit = () => {
    onRunAI("edit", instruction);
    setInstruction("");
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0a0a12]/70 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Sparkles className="h-4 w-4 text-fuchsia-300" />
          {t("ai")}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto_auto]">
        <input
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder={t("editInstructionPlaceholder")}
          className="h-10 rounded-lg border border-white/[0.08] bg-[#09090f] px-3 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40"
        />
        <select
          value={model}
          onChange={(event) => onModelChange(event.target.value)}
          aria-label={t("modelLabel")}
          className="h-10 rounded-lg border border-white/[0.08] bg-[#09090f] px-3 text-xs text-zinc-300 outline-none"
        >
          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
        </select>
        <button
          type="button"
          onClick={() => onRunAI("generate", "")}
          disabled={disabled}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/20 disabled:opacity-50"
        >
          {loadingMode === "generate" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {t("generateWithAI")}
        </button>
        <button
          type="button"
          onClick={runEdit}
          disabled={disabled || !question.answer || !instruction.trim()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-teal-500/20 bg-teal-500/10 px-4 text-sm font-semibold text-teal-200 hover:bg-teal-500/20 disabled:opacity-50"
        >
          {loadingMode === "edit" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
          {t("editWithAI")}
        </button>
      </div>
      {!hasGeminiApiKey && (
        <button
          type="button"
          onClick={onOpenSettings}
          className="mt-3 text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200"
        >
          {t("configureGemini")}
        </button>
      )}
    </div>
  );
}
