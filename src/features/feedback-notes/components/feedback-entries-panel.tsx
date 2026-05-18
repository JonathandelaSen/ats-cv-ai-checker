"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Loader2, Lock, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { FeedbackEntry } from "../api/feedback-notes-api";

const textareaClass =
  "w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface FeedbackEntriesPanelProps {
  entries: FeedbackEntry[];
  isClosed: boolean;
  isSaving: boolean;
  deletingEntryIds: Set<string>;
  onCreateEntry: (content: string) => void;
  onUpdateEntry: (entryId: string, content: string) => void;
  onDeleteEntry: (entryId: string) => void;
}

export function FeedbackEntriesPanel({
  entries,
  isClosed,
  isSaving,
  deletingEntryIds,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
}: FeedbackEntriesPanelProps) {
  const t = useTranslations("feedbackNotes");
  const [entryDraft, setEntryDraft] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryEditDraft, setEntryEditDraft] = useState("");

  const submitEntry = () => {
    const content = entryDraft.trim();
    if (!content) return;
    setEntryDraft("");
    onCreateEntry(content);
  };

  const submitEdit = (entryId: string) => {
    const content = entryEditDraft.trim();
    if (!content) return;
    setEditingEntryId(null);
    onUpdateEntry(entryId, content);
  };

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">{t("entries.title")}</h2>
        {isClosed && (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <Lock className="h-3.5 w-3.5" />
            {t("status.closed")}
          </span>
        )}
      </div>
      {!isClosed && (
        <div className="mb-4">
          <textarea
            value={entryDraft}
            onChange={(event) => setEntryDraft(event.target.value)}
            placeholder={t("entries.placeholder")}
            rows={4}
            disabled={isSaving}
            className={textareaClass}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={submitEntry}
              disabled={isSaving || !entryDraft.trim()}
              className="inline-flex min-w-[6.75rem] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t("entries.add")}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">{formatDate(entry.createdAt)}</p>
                {!isClosed && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntryId(entry.id);
                        setEntryEditDraft(entry.content);
                      }}
                      disabled={deletingEntryIds.has(entry.id)}
                      className="rounded-md p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      disabled={deletingEntryIds.has(entry.id)}
                      className="rounded-md p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                    >
                      {deletingEntryIds.has(entry.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              {editingEntryId === entry.id ? (
                <div>
                  <textarea
                    value={entryEditDraft}
                    onChange={(event) => setEntryEditDraft(event.target.value)}
                    rows={4}
                    className={textareaClass}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingEntryId(null)}
                      className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-white/[0.06]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => submitEdit(entry.id)}
                      className="rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12]"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                  {entry.content}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
