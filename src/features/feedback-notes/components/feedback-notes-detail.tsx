"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Archive, RefreshCw, Save, Trash2 } from "lucide-react";
import type { FeedbackEntry, FeedbackListItem } from "../api/feedback-notes-api";
import { FeedbackEntriesPanel } from "./feedback-entries-panel";
import { FeedbackFinalPanel } from "./feedback-final-panel";

interface FeedbackNotesDetailProps {
  feedback: FeedbackListItem;
  entries: FeedbackEntry[];
  deletingEntryIds: Set<string>;
  isSaving: boolean;
  isGenerating: boolean;
  onUpdateFeedback: (
    updates: { personName?: string; finalFeedback?: string | null }
  ) => void;
  onDeleteFeedback: () => void;
  onCloseFeedback: () => void;
  onReopenFeedback: () => void;
  onCreateEntry: (content: string) => void;
  onUpdateEntry: (entryId: string, content: string) => void;
  onDeleteEntry: (entryId: string) => void;
  onGenerate: (model: string) => void;
  onCopyPrompt: (prompt: string) => void;
}

export function FeedbackNotesDetail({
  feedback,
  entries,
  deletingEntryIds,
  isSaving,
  isGenerating,
  onUpdateFeedback,
  onDeleteFeedback,
  onCloseFeedback,
  onReopenFeedback,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
  onGenerate,
  onCopyPrompt,
}: FeedbackNotesDetailProps) {
  const t = useTranslations("feedbackNotes");
  const [personNameDraft, setPersonNameDraft] = useState(feedback.personName);
  const isClosed = feedback.status === "closed";

  useEffect(() => {
    setPersonNameDraft(feedback.personName);
  }, [feedback.id, feedback.personName]);

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <section className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            {t("fields.personName")}
          </label>
          <input
            value={personNameDraft}
            onChange={(event) => setPersonNameDraft(event.target.value)}
            disabled={isClosed}
            className="w-full bg-transparent text-2xl font-semibold text-zinc-100 outline-none disabled:opacity-80"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isClosed && personNameDraft !== feedback.personName && (
            <button
              type="button"
              onClick={() => onUpdateFeedback({ personName: personNameDraft })}
              className="inline-flex items-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12]"
            >
              <Save className="h-4 w-4" />
              {t("actions.saveName")}
            </button>
          )}
          {isClosed ? (
            <button
              type="button"
              onClick={onReopenFeedback}
              className="inline-flex items-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12]"
            >
              <RefreshCw className="h-4 w-4" />
              {t("actions.reopen")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCloseFeedback}
              className="inline-flex items-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12]"
            >
              <Archive className="h-4 w-4" />
              {t("actions.close")}
            </button>
          )}
          <button
            type="button"
            onClick={onDeleteFeedback}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/15"
          >
            <Trash2 className="h-4 w-4" />
            {t("actions.delete")}
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <FeedbackEntriesPanel
          entries={entries}
          isClosed={isClosed}
          isSaving={isSaving}
          deletingEntryIds={deletingEntryIds}
          onCreateEntry={onCreateEntry}
          onUpdateEntry={onUpdateEntry}
          onDeleteEntry={onDeleteEntry}
        />
        <FeedbackFinalPanel
          feedback={feedback}
          entries={entries}
          isClosed={isClosed}
          isSaving={isSaving}
          isGenerating={isGenerating}
          onSaveFinalFeedback={(finalFeedback) => onUpdateFeedback({ finalFeedback })}
          onGenerate={onGenerate}
          onCopyPrompt={onCopyPrompt}
        />
      </section>
    </div>
  );
}
