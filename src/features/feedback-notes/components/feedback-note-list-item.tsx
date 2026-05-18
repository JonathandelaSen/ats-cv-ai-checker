"use client";

import { useTranslations } from "next-intl";
import type { FeedbackListItem } from "../api/feedback-notes-api";

interface FeedbackNoteListItemProps {
  feedback: FeedbackListItem;
  isSelected: boolean;
  onSelect: () => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FeedbackNoteListItem({
  feedback,
  isSelected,
  onSelect,
}: FeedbackNoteListItemProps) {
  const t = useTranslations("feedbackNotes");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mb-1 w-full rounded-lg px-3 py-3 text-left transition-colors ${
        isSelected
          ? "bg-white/[0.08] text-zinc-100"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">{feedback.personName}</p>
        <span
          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${
            feedback.status === "active"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
          }`}
        >
          {t(`status.${feedback.status}`)}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-600">
        {t("updated", { date: formatDate(feedback.updatedAt) })}
      </p>
    </button>
  );
}
