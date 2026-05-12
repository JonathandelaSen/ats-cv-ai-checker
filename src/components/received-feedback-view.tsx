"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { ReceivedFeedbackPrimitives } from "@/modules/received-feedback";
import { getErrorMessage } from "@/lib/errors";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0";

const textareaClass =
  "w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0";

interface FormState {
  receivedDate: string;
  giverName: string;
  feedbackText: string;
  userNote: string;
}

const emptyForm = (): FormState => ({
  receivedDate: new Date().toISOString().slice(0, 10),
  giverName: "",
  feedbackText: "",
  userNote: "",
});

export default function ReceivedFeedbackView() {
  const [items, setItems] = useState<ReceivedFeedbackPrimitives[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
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
      const res = await fetch("/api/received-feedback");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load received feedback");
      setItems(data);
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
    setForm(emptyForm());
    setEditingId(null);
    setIsFormOpen(true);
    setError(null);
  };

  const openEditForm = (item: ReceivedFeedbackPrimitives) => {
    setForm({
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

  const saveFeedback = async () => {
    if (!form.receivedDate || !form.giverName.trim() || !form.feedbackText.trim()) {
      setError("Received date, from, and feedback are required.");
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
            giverName: form.giverName,
            feedbackText: form.feedbackText,
            userNote: form.userNote,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save received feedback");
      await fetchItems();
      closeForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteFeedback = async (item: ReceivedFeedbackPrimitives) => {
    if (!window.confirm("Delete this received feedback?")) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/received-feedback/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete received feedback");
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
            <h1 className="text-lg font-semibold">Received Feedback</h1>
          </div>
          <button
            onClick={openNewForm}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-60"
            disabled={saving}
          >
            <Plus className="h-4 w-4" />
            New feedback
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
                {isEditing ? "Edit feedback" : "New feedback"}
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
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-500">Received date</span>
                <input
                  type="date"
                  max={today}
                  className={inputClass}
                  value={form.receivedDate}
                  onChange={(event) => setForm({ ...form, receivedDate: event.target.value })}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-zinc-500">From</span>
                <input
                  className={inputClass}
                  maxLength={120}
                  placeholder="Manager, lead, peer..."
                  value={form.giverName}
                  onChange={(event) => setForm({ ...form, giverName: event.target.value })}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-zinc-500">Feedback</span>
                <textarea
                  className={textareaClass}
                  maxLength={10000}
                  rows={5}
                  placeholder="What did they say?"
                  value={form.feedbackText}
                  onChange={(event) => setForm({ ...form, feedbackText: event.target.value })}
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-medium text-zinc-500">Private note</span>
                <textarea
                  className={textareaClass}
                  maxLength={10000}
                  rows={3}
                  placeholder="Optional note for yourself"
                  value={form.userNote}
                  onChange={(event) => setForm({ ...form, userNote: event.target.value })}
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={() => void saveFeedback()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </section>
        )}

        <section className="min-h-0">
          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading feedback
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 py-12 text-center">
              <p className="text-sm font-medium text-zinc-300">No received feedback yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
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
                        <span>From {item.giverName}</span>
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
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
