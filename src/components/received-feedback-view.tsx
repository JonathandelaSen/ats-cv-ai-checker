"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ActivityContextPrimitives, ActivityContextType } from "@/modules/activity";
import type { ReceivedFeedbackPrimitives } from "@/modules/received-feedback";
import { getErrorMessage } from "@/lib/errors";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0";

const textareaClass =
  "w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0";

interface FormState {
  activityContextId: string;
  receivedDate: string;
  giverName: string;
  feedbackText: string;
  userNote: string;
}

const emptyForm = (): FormState => ({
  activityContextId: "",
  receivedDate: new Date().toISOString().slice(0, 10),
  giverName: "",
  feedbackText: "",
  userNote: "",
});

export default function ReceivedFeedbackView() {
  const t = useTranslations("receivedFeedback");
  const [items, setItems] = useState<ReceivedFeedbackPrimitives[]>([]);
  const [contexts, setContexts] = useState<ActivityContextPrimitives[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [contextDraft, setContextDraft] = useState({
    name: "",
    type: "project" as ActivityContextType,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isEditing = editingId !== null;

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const [feedbackRes, contextsRes] = await Promise.all([
        fetch("/api/received-feedback"),
        fetch("/api/activity-contexts"),
      ]);
      const feedbackData = await feedbackRes.json();
      const contextsData = await contextsRes.json();
      if (!feedbackRes.ok) throw new Error(feedbackData.error || t("errors.loadFeedback"));
      if (!contextsRes.ok) throw new Error(contextsData.error || t("errors.loadContexts"));
      const loadedContexts = (contextsData.contexts ?? []) as ActivityContextPrimitives[];
      setItems(feedbackData);
      setContexts(loadedContexts);
      const defaultContext =
        loadedContexts.find((context) => context.isDefault) ?? loadedContexts[0];
      if (defaultContext && !form.activityContextId) {
        setForm((current) => ({ ...current, activityContextId: defaultContext.id }));
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchItems());
  }, []);

  const openNewForm = () => {
    const defaultContext = contexts.find((context) => context.isDefault) ?? contexts[0];
    setForm({ ...emptyForm(), activityContextId: defaultContext?.id ?? "" });
    setEditingId(null);
    setIsFormOpen(true);
    setError(null);
  };

  const openEditForm = (item: ReceivedFeedbackPrimitives) => {
    setForm({
      activityContextId: item.activityContextId ?? contexts.find((context) => context.isDefault)?.id ?? contexts[0]?.id ?? "",
      receivedDate: item.receivedDate,
      giverName: item.giverName,
      feedbackText: item.feedbackText,
      userNote: item.userNote ?? "",
    });
    setEditingId(item.id);
    setIsFormOpen(true);
    setError(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const createContext = async () => {
    if (!contextDraft.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/activity-contexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contextDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.createContext"));
      setContextDraft({ name: "", type: "project" });
      await fetchItems();
      setForm((current) => ({ ...current, activityContextId: data.id }));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveFeedback = async () => {
    if (!form.receivedDate || !form.giverName.trim() || !form.feedbackText.trim()) {
      setError(t("errors.required"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        isEditing ? `/api/received-feedback/${editingId}` : "/api/received-feedback",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receivedDate: form.receivedDate,
            activityContextId: form.activityContextId,
            giverName: form.giverName,
            feedbackText: form.feedbackText,
            userNote: form.userNote,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.saveFeedback"));
      await fetchItems();
      closeForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteFeedback = async (item: ReceivedFeedbackPrimitives) => {
    if (!window.confirm(t("confirmDelete"))) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/received-feedback/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.deleteFeedback"));
      await fetchItems();
      if (editingId === item.id) closeForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#09090f] text-zinc-100">
      <header className="shrink-0 border-b border-white/[0.06] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{t("title")}</h1>
          </div>
          <button
            onClick={openNewForm}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-60"
            disabled={saving}
          >
            <Plus className="h-4 w-4" />
            {t("newFeedback")}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
        {error && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        {isFormOpen && (
          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">
                {isEditing ? t("editFeedback") : t("newFeedback")}
              </h2>
              <button
                onClick={closeForm}
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-zinc-500">{t("fields.activityContext")}</span>
                <select
                  className={inputClass}
                  value={form.activityContextId}
                  onChange={(event) => setForm({ ...form, activityContextId: event.target.value })}
                >
                  {contexts.map((context) => (
                    <option key={context.id} value={context.id} className="bg-zinc-900">
                      {context.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-500">{t("fields.receivedDate")}</span>
                <input
                  type="date"
                  max={today}
                  className={inputClass}
                  value={form.receivedDate}
                  onChange={(event) => setForm({ ...form, receivedDate: event.target.value })}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-500">{t("fields.from")}</span>
                <input
                  className={inputClass}
                  maxLength={120}
                  placeholder={t("placeholders.from")}
                  value={form.giverName}
                  onChange={(event) => setForm({ ...form, giverName: event.target.value })}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-zinc-500">{t("fields.feedback")}</span>
                <textarea
                  className={textareaClass}
                  maxLength={10000}
                  rows={5}
                  placeholder={t("placeholders.feedback")}
                  value={form.feedbackText}
                  onChange={(event) => setForm({ ...form, feedbackText: event.target.value })}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-zinc-500">{t("fields.privateNote")}</span>
                <textarea
                  className={textareaClass}
                  maxLength={10000}
                  rows={3}
                  placeholder={t("placeholders.privateNote")}
                  value={form.userNote}
                  onChange={(event) => setForm({ ...form, userNote: event.target.value })}
                />
              </label>
              <div className="flex gap-2 md:col-span-2">
                <input
                  className={inputClass}
                  placeholder={t("placeholders.newContext")}
                  value={contextDraft.name}
                  onChange={(event) => setContextDraft({ ...contextDraft, name: event.target.value })}
                />
                <select
                  className={`${inputClass} max-w-36`}
                  value={contextDraft.type}
                  onChange={(event) =>
                    setContextDraft({
                      ...contextDraft,
                      type: event.target.value as ActivityContextType,
                    })
                  }
                >
                  <option value="project" className="bg-zinc-900">{t("contextTypes.project")}</option>
                  <option value="employment" className="bg-zinc-900">{t("contextTypes.employment")}</option>
                  <option value="personal" className="bg-zinc-900">{t("contextTypes.personal")}</option>
                  <option value="other" className="bg-zinc-900">{t("contextTypes.other")}</option>
                </select>
                <button
                  onClick={() => void createContext()}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5 disabled:opacity-60"
                  disabled={saving || !contextDraft.name.trim()}
                >
                  <Plus className="h-4 w-4" />
                  {t("actions.add")}
                </button>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                disabled={saving}
              >
                {t("actions.cancel")}
              </button>
              <button
                onClick={() => void saveFeedback()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("actions.save")}
              </button>
            </div>
          </section>
        )}

        <section className="min-h-0">
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loading")}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 py-12 text-center">
              <p className="text-sm font-medium text-zinc-300">{t("empty")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const contextName = contexts.find((context) => context.id === item.activityContextId)?.name;
                return (
                <article
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-white/[0.025] p-4 transition-colors hover:border-white/15"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {item.receivedDate}
                        </span>
                        <span>{t("fromPerson", { name: item.giverName })}</span>
                        {contextName && <span>{contextName}</span>}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                        {item.feedbackText}
                      </p>
                      {item.userNote && (
                        <p className="mt-3 whitespace-pre-wrap border-l border-white/10 pl-3 text-sm leading-6 text-zinc-400">
                          {item.userNote}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEditForm(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
                        disabled={saving}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void deleteFeedback(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
