"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Clipboard, Copy, Loader2, Save, Sparkles } from "lucide-react";
import {
  buildFeedbackNotesFinalPrompt,
  type FeedbackEntry,
  type FeedbackListItem,
} from "../api/feedback-notes-api";

const textareaClass =
  "w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

interface FeedbackFinalPanelProps {
  feedback: FeedbackListItem;
  entries: FeedbackEntry[];
  isClosed: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  onSaveFinalFeedback: (finalFeedback: string | null) => void;
  onGenerate: (model: string) => void;
  onCopyPrompt: (prompt: string) => void;
}

export function FeedbackFinalPanel({
  feedback,
  entries,
  isClosed,
  isSaving,
  isGenerating,
  onSaveFinalFeedback,
  onGenerate,
  onCopyPrompt,
}: FeedbackFinalPanelProps) {
  const t = useTranslations("feedbackNotes");
  const [finalDraft, setFinalDraft] = useState(feedback.finalFeedback ?? "");
  const [finalCopied, setFinalCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.1-pro-preview");

  useEffect(() => {
    setFinalDraft(feedback.finalFeedback ?? "");
  }, [feedback.id, feedback.finalFeedback]);

  const copyFinalFeedback = async () => {
    if (!finalDraft.trim()) return;
    await navigator.clipboard.writeText(finalDraft);
    setFinalCopied(true);
    setTimeout(() => setFinalCopied(false), 2000);
  };

  const copyPrompt = async () => {
    if (entries.length === 0) return;
    const prompt = buildFeedbackNotesFinalPrompt({
      personName: feedback.personName,
      entries: entries.map((entry) => ({
        content: entry.content,
        createdAt: entry.createdAt,
      })),
    });
    await navigator.clipboard.writeText(prompt);
    onCopyPrompt(prompt);
  };

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-200">{t("final.title")}</h2>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500">{t("final.modelLabel")}</label>
          <select
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
            disabled={isClosed || isGenerating}
            className="rounded-md border border-white/10 bg-[#0d0d14] px-2 py-1 text-xs text-zinc-300 outline-none transition-colors focus:border-zinc-300 disabled:opacity-50"
          >
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
            <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash Preview</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          </select>
        </div>
      </div>
      <textarea
        value={finalDraft}
        onChange={(event) => setFinalDraft(event.target.value)}
        disabled={isClosed}
        placeholder={t("final.placeholder")}
        rows={14}
        className={textareaClass}
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {!isClosed && (
          <button
            type="button"
            onClick={() => onSaveFinalFeedback(finalDraft || null)}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {t("final.save")}
          </button>
        )}
        <button
          type="button"
          onClick={() => void copyFinalFeedback()}
          disabled={!finalDraft.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12] disabled:opacity-50"
        >
          {finalCopied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {finalCopied ? t("final.copied") : t("final.copy")}
        </button>
        {!isClosed && (
          <button
            type="button"
            onClick={() => onGenerate(selectedModel)}
            disabled={isGenerating || entries.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t("final.generate")}
          </button>
        )}
        <button
          type="button"
          onClick={() => void copyPrompt()}
          disabled={entries.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12] disabled:opacity-50"
        >
          <Clipboard className="h-4 w-4" />
          {t("final.copyPrompt")}
        </button>
      </div>
    </div>
  );
}
