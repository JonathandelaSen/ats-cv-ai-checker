"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, RefreshCw } from "lucide-react";
import type { FeedbackFilter, FeedbackListItem } from "../api/feedback-notes-api";
import { FeedbackNotesListSkeleton } from "./feedback-notes-skeleton";
import { FeedbackNoteListItem } from "./feedback-note-list-item";

const inputClass =
  "w-full bg-transparent border-b border-white/10 px-0 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0";

interface FeedbackNotesSidebarProps {
  feedbacks: FeedbackListItem[];
  selectedId: string | null;
  status: FeedbackFilter;
  isLoading: boolean;
  isCreating: boolean;
  onStatusChange: (status: FeedbackFilter) => void;
  onSelect: (feedbackId: string) => void;
  onRefresh: () => void;
  onCreate: (personName: string) => void;
}

export function FeedbackNotesSidebar({
  feedbacks,
  selectedId,
  status,
  isLoading,
  isCreating,
  onStatusChange,
  onSelect,
  onRefresh,
  onCreate,
}: FeedbackNotesSidebarProps) {
  const t = useTranslations("feedbackNotes");
  const [newPersonName, setNewPersonName] = useState("");

  const submit = () => {
    const personName = newPersonName.trim();
    if (!personName) return;
    onCreate(personName);
    setNewPersonName("");
  };

  return (
    <aside className="flex w-full max-w-sm shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0d14]/80">
      <div className="border-b border-white/[0.06] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{t("title")}</h1>
            <p className="text-xs text-zinc-500">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
            title={t("actions.refresh")}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 flex rounded-lg bg-white/[0.04] p-1">
          {(["active", "closed", "all"] as FeedbackFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onStatusChange(item)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                status === item
                  ? "bg-white/[0.10] text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t(`filters.${item}`)}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <input
            value={newPersonName}
            onChange={(event) => setNewPersonName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder={t("fields.personName")}
            className={inputClass}
          />
          <button
            type="button"
            onClick={submit}
            disabled={isCreating}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <FeedbackNotesListSkeleton />
        ) : feedbacks.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-600">
            {t("empty")}
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <FeedbackNoteListItem
              key={feedback.id}
              feedback={feedback}
              isSelected={selectedId === feedback.id}
              onSelect={() => onSelect(feedback.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
