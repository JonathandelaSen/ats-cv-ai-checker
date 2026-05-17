"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Archive,
  Check,
  Clipboard,
  Copy,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  buildFeedbackNotesFinalPrompt,
  type FeedbackNotesFinalPromptEntry,
} from "@/modules/feedback-notes/client";
import type {
  FeedbackEntryPrimitives,
  FeedbackPrimitives,
  FeedbackStatus,
} from "@/modules/feedback-notes/client";
import { getErrorMessage } from "@/lib/errors";
import { CopyPromptModal } from "@/components/shared/copy-prompt-modal";
import { FeedbackNotesListSkeleton, FeedbackNotesDetailSkeleton } from "./feedback-notes-skeleton";

interface FeedbackNotesViewProps {
  geminiApiKey: string;
  hasGeminiApiKey: boolean;
  onOpenSettings: () => void;
}

type FeedbackFilter = FeedbackStatus | "all";

const inputClass =
  "w-full bg-transparent border-b border-white/10 px-0 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0";

const textareaClass =
  "w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

export default function FeedbackNotesView({
  geminiApiKey,
  hasGeminiApiKey,
  onOpenSettings,
}: FeedbackNotesViewProps) {
  const t = useTranslations("feedbackNotes");
  const [filter, setFilter] = useState<FeedbackFilter>("active");
  const [feedbacks, setFeedbacks] = useState<FeedbackPrimitives[]>([]);
  const [entries, setEntries] = useState<FeedbackEntryPrimitives[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newPersonName, setNewPersonName] = useState("");
  const [entryDraft, setEntryDraft] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryEditDraft, setEntryEditDraft] = useState("");
  const [finalDraft, setFinalDraft] = useState("");
  const [personNameDraft, setPersonNameDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copiedPromptContent, setCopiedPromptContent] = useState("");
  const [finalCopied, setFinalCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.1-pro-preview");

  const selectedFeedback = useMemo(
    () => feedbacks.find((feedback) => feedback.id === selectedId) ?? null,
    [feedbacks, selectedId]
  );
  const isClosed = selectedFeedback?.status === "closed";
  const isInitialListLoading = loading && feedbacks.length === 0;

  const fetchFeedbacks = async (nextSelectedId = selectedId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback-notes/feedbacks?status=${filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.loadFeedbacks"));
      const loaded = data as FeedbackPrimitives[];
      setFeedbacks(loaded);
      const next =
        (nextSelectedId && loaded.find((item) => item.id === nextSelectedId)?.id) ??
        loaded[0]?.id ??
        null;
      setSelectedId(next);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (feedbackId: string | null) => {
    if (!feedbackId) {
      setEntries([]);
      return;
    }
    try {
      const res = await fetch(`/api/feedback-notes/feedbacks/${feedbackId}/entries`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.loadEntries"));
      setEntries(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchFeedbacks(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchEntries(selectedId);
      const feedback = feedbacks.find((item) => item.id === selectedId);
      setFinalDraft(feedback?.final_feedback ?? "");
      setPersonNameDraft(feedback?.person_name ?? "");
      setEntryDraft("");
      setEditingEntryId(null);
    });
  }, [feedbacks, selectedId]);

  const createFeedback = async () => {
    if (!newPersonName.trim()) {
      setError(t("errors.personNameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback-notes/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_name: newPersonName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.createFeedback"));
      setNewPersonName("");
      if (filter !== "active") {
        setSelectedId(data.id);
        setFilter("active");
      } else {
        await fetchFeedbacks(data.id);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const patchFeedback = async (updates: Record<string, unknown>) => {
    if (!selectedFeedback) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback-notes/feedbacks/${selectedFeedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.updateFeedback"));
      await fetchFeedbacks(data.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const addEntry = async () => {
    if (!selectedFeedback || !entryDraft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/feedback-notes/feedbacks/${selectedFeedback.id}/entries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: entryDraft }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.addEntry"));
      setEntryDraft("");
      await fetchEntries(selectedFeedback.id);
      await fetchFeedbacks(selectedFeedback.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateEntry = async (entryId: string) => {
    if (!entryEditDraft.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback-notes/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: entryEditDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.updateEntry"));
      setEditingEntryId(null);
      await fetchEntries(selectedFeedback?.id ?? null);
      await fetchFeedbacks(selectedFeedback?.id ?? null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm(t("confirmDeleteEntry"))) return;
    const res = await fetch(`/api/feedback-notes/entries/${entryId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t("errors.deleteEntry"));
      return;
    }
    await fetchEntries(selectedFeedback?.id ?? null);
    await fetchFeedbacks(selectedFeedback?.id ?? null);
  };

  const deleteFeedback = async () => {
    if (!selectedFeedback) return;
    if (!confirm(t("confirmDeleteFeedback"))) {
      return;
    }
    const res = await fetch(`/api/feedback-notes/feedbacks/${selectedFeedback.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t("errors.deleteFeedback"));
      return;
    }
    await fetchFeedbacks(null);
  };

  const setStatus = async (action: "close" | "reopen") => {
    if (!selectedFeedback) return;
    const res = await fetch(
      `/api/feedback-notes/feedbacks/${selectedFeedback.id}/${action}`,
      { method: "POST" }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("errors.changeStatus"));
      return;
    }
    await fetchFeedbacks(data.id);
  };

  const generateWithAI = async () => {
    if (!selectedFeedback) return;
    if (!hasGeminiApiKey) {
      onOpenSettings();
      return;
    }
    if (entries.length === 0) {
      setError("Add at least one entry before generating feedback.");
      return;
    }
    if (
      finalDraft.trim() &&
      !confirm("This will replace your current final feedback.")
    ) {
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/feedback-notes/feedbacks/${selectedFeedback.id}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            geminiApiKey,
            model: selectedModel,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.generateFeedback"));
      await fetchFeedbacks(data.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  };

  const copyPrompt = async () => {
    if (!selectedFeedback || entries.length === 0) return;
    const prompt = buildFeedbackNotesFinalPrompt({
      personName: selectedFeedback.person_name,
      entries: entries.map((entry): FeedbackNotesFinalPromptEntry => ({
        content: entry.content,
        created_at: entry.created_at,
      })),
    }, true);
    await navigator.clipboard.writeText(prompt);
    setCopiedPromptContent(prompt);
    setIsCopyModalOpen(true);
  };

  const copyFinalFeedback = async () => {
    if (!finalDraft.trim()) return;
    await navigator.clipboard.writeText(finalDraft);
    setFinalCopied(true);
    setTimeout(() => setFinalCopied(false), 2000);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex h-full min-h-0 bg-[#09090f] text-zinc-100">
      <aside className="flex w-full max-w-sm shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0d14]/80">
        <div className="border-b border-white/[0.06] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">{t("title")}</h1>
              <p className="text-xs text-zinc-500">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchFeedbacks(selectedId)}
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
                onClick={() => setFilter(item)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === item
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
                if (event.key === "Enter") void createFeedback();
              }}
              placeholder={t("fields.personName")}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => void createFeedback()}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {isInitialListLoading ? (
            <FeedbackNotesListSkeleton />
          ) : feedbacks.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-600">
              {t("empty")}
            </div>
          ) : (
            feedbacks.map((feedback) => (
              <button
                key={feedback.id}
                type="button"
                onClick={() => setSelectedId(feedback.id)}
                className={`mb-1 w-full rounded-lg px-3 py-3 text-left transition-colors ${
                  selectedId === feedback.id
                    ? "bg-white/[0.08] text-zinc-100"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{feedback.person_name}</p>
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
                  {t("updated", { date: formatDate(feedback.updated_at) })}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        {error && (
          <div className="m-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        {isInitialListLoading ? (
          <FeedbackNotesDetailSkeleton />
        ) : !selectedFeedback ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">
            {t("emptySelection")}
          </div>
        ) : (
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
                {!isClosed && personNameDraft !== selectedFeedback.person_name && (
                  <button
                    type="button"
                    onClick={() => void patchFeedback({ person_name: personNameDraft })}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12]"
                  >
                    <Save className="h-4 w-4" />
                    {t("actions.saveName")}
                  </button>
                )}
                {isClosed ? (
                  <button
                    type="button"
                    onClick={() => void setStatus("reopen")}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("actions.reopen")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setStatus("close")}
                    className="inline-flex items-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.12]"
                  >
                    <Archive className="h-4 w-4" />
                    {t("actions.close")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void deleteFeedback()}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/15"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("actions.delete")}
                </button>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
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
                      className={textareaClass}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void addEntry()}
                        disabled={saving || !entryDraft.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
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
                          <p className="text-xs text-zinc-500">
                            {formatDate(entry.created_at)}
                          </p>
                          {!isClosed && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEntryId(entry.id);
                                  setEntryEditDraft(entry.content);
                                }}
                                className="rounded-md p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteEntry(entry.id)}
                                className="rounded-md p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {editingEntryId === entry.id ? (
                          <div>
                            <textarea
                              value={entryEditDraft}
                              onChange={(event) =>
                                setEntryEditDraft(event.target.value)
                              }
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
                                onClick={() => void updateEntry(entry.id)}
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

              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-zinc-200">
                    {t("final.title")}
                  </h2>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-500">{t("final.modelLabel")}</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      disabled={isClosed || aiLoading}
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
                      onClick={() => void patchFeedback({ final_feedback: finalDraft })}
                      disabled={saving}
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
                      onClick={() => void generateWithAI()}
                      disabled={aiLoading || entries.length === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {aiLoading ? (
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
            </section>
          </div>
        )}
      </main>
      
      <CopyPromptModal 
        isOpen={isCopyModalOpen} 
        onClose={() => setIsCopyModalOpen(false)} 
        title={t("copyPrompt.title")}
        message={t("copyPrompt.message")}
        promptContent={copiedPromptContent}
      />
    </div>
  );
}

