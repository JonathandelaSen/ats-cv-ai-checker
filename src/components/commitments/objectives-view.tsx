"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Check,
  ChevronRight,
  Circle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Target,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import type {
  CommitmentContextPrimitives,
  CommitmentContextType,
  CommitmentItemPrimitives,
  CommitmentItemStatus,
  CommitmentOutcomePrimitives,
  CommitmentOutcomeStatus,
  CommitmentOutcomeType,
  CommitmentPriority,
  CommitmentPrimitives,
  CommitmentSource,
  CommitmentStatus,
} from "@/modules/commitments";
import { getErrorMessage } from "@/lib/errors";
import { ObjectivesSidebarSkeleton, ObjectivesDetailSkeleton } from "@/components/shared/skeletons";

interface CommitmentWithRelations extends CommitmentPrimitives {
  items: CommitmentItemPrimitives[];
  outcomes: CommitmentOutcomePrimitives[];
}

interface WorkspaceResponse {
  contexts: CommitmentContextPrimitives[];
  commitments: CommitmentWithRelations[];
}

interface CommitmentForm {
  contextId: string;
  title: string;
  description: string;
  successCriteria: string;
  resultNotes: string;
  source: CommitmentSource;
  status: CommitmentStatus;
  priority: "" | CommitmentPriority;
  startDate: string;
  targetDate: string;
}

interface ItemEditForm {
  title: string;
  notes: string;
  evidenceNotes: string;
  status: CommitmentItemStatus;
  dueDate: string;
}

interface OutcomeEditForm {
  title: string;
  description: string;
  type: CommitmentOutcomeType;
  status: CommitmentOutcomeStatus;
  amount: string;
  currency: string;
}

const inputClass =
  "w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-300/60";
const textareaClass =
  "w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-300/60";
const selectClass =
  "rounded-md border border-white/10 bg-[#11140f] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-300/60";

const statusLabels: Record<CommitmentStatus, string> = {
  active: "Active",
  paused: "Paused",
  achieved: "Achieved",
  missed: "Missed",
  cancelled: "Cancelled",
};

const outcomeLabels: Record<CommitmentOutcomeType, string> = {
  promotion: "Promotion",
  role_change: "Role",
  leadership: "Leadership",
  mentoring: "Mentoring",
  money: "Money",
  recognition: "Recognition",
  learning: "Learning",
  other: "Other",
};

const itemStatusLabels: Record<CommitmentItemStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};


function formatDate(d: string | null): string {
  if (!d) return "";
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ObjectivesView() {
  const t = useTranslations("objectives");
  const [contexts, setContexts] = useState<CommitmentContextPrimitives[]>([]);
  const [commitments, setCommitments] = useState<CommitmentWithRelations[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "all" | "closed">("open");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CommitmentForm | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newOutcomeTitle, setNewOutcomeTitle] = useState("");
  const [newOutcomeType, setNewOutcomeType] = useState<CommitmentOutcomeType>("leadership");
  const [contextDraft, setContextDraft] = useState({ name: "", type: "project" as CommitmentContextType });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemEditForm | null>(null);
  const [editingOutcomeId, setEditingOutcomeId] = useState<string | null>(null);
  const [outcomeForm, setOutcomeForm] = useState<OutcomeEditForm | null>(null);
  const hasLoadedWorkspace = !loading || commitments.length > 0 || contexts.length > 0;

  const isEmpty = commitments.length === 0;
  const visibleContexts = contexts;
  const visibleCommitments = commitments;
  const selected = visibleCommitments.find((item) => item.id === selectedId) ?? visibleCommitments[0] ?? null;

  const filteredCommitments = useMemo(() => {
    return visibleCommitments.filter((commitment) => {
      if (filter === "all") return true;
      const closed = ["achieved", "missed", "cancelled"].includes(commitment.status);
      return filter === "closed" ? closed : !closed;
    });
  }, [filter, visibleCommitments]);

  const fetchWorkspace = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commitments");
      const data = (await res.json()) as WorkspaceResponse | { error?: string };
      if (!res.ok) throw new Error("error" in data ? data.error : t("errors.load"));
      const workspace = data as WorkspaceResponse;
      setContexts(workspace.contexts);
      setCommitments(workspace.commitments);
      setSelectedId((current) => current ?? workspace.commitments[0]?.id ?? null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchWorkspace());
  }, []);

  const startCreate = () => {
    const defaultContext = contexts.find((context) => context.isDefault) ?? contexts[0];
    const today = new Date().toISOString().slice(0, 10);
    setIsCreating(true);
    setForm({
      contextId: defaultContext?.id ?? "",
      title: "",
      description: "",
      successCriteria: "",
      resultNotes: "",
      source: "self",
      status: "active",
      priority: "",
      startDate: today,
      targetDate: "",
    });
  };

  const startEdit = (commitment: CommitmentWithRelations) => {
    setIsCreating(false);
    setForm({
      contextId: commitment.contextId,
      title: commitment.title,
      description: commitment.description ?? "",
      successCriteria: commitment.successCriteria ?? "",
      resultNotes: commitment.resultNotes ?? "",
      source: commitment.source,
      status: commitment.status,
      priority: commitment.priority ?? "",
      startDate: commitment.startDate,
      targetDate: commitment.targetDate ?? "",
    });
  };

  const saveCommitment = async () => {
    if (!form || !form.title.trim() || !form.contextId) {
      setError(t("errors.required"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const targetId = isCreating ? null : selected?.id;
      const res = await fetch(targetId ? `/api/commitments/${targetId}` : "/api/commitments", {
        method: targetId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          priority: form.priority || null,
          targetDate: form.targetDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.saveObjective"));
      setForm(null);
      setIsCreating(false);
      await fetchWorkspace(true);
      setSelectedId(data.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const createContext = async () => {
    if (!contextDraft.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/commitments/contexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contextDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.createContext"));
      setContextDraft({ name: "", type: "project" });
      await fetchWorkspace(true);
      setForm((current) => (current ? { ...current, contextId: data.id } : current));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateItemStatus = async (item: CommitmentItemPrimitives, status: CommitmentItemStatus) => {
    if (isEmpty) return;
    const completedAt = status === "done" ? new Date().toISOString() : null;
    await mutate(`/api/commitments/items/${item.id}`, {
      method: "PATCH",
      body: { status, completedAt },
    });
  };

  const startEditItem = (item: CommitmentItemPrimitives) => {
    if (isEmpty) return;
    setEditingItemId(item.id);
    setItemForm({
      title: item.title,
      notes: item.notes ?? "",
      evidenceNotes: item.evidenceNotes ?? "",
      status: item.status,
      dueDate: item.dueDate ?? "",
    });
  };

  const saveItem = async () => {
    if (!editingItemId || !itemForm || !itemForm.title.trim()) return;
    const completedAt = itemForm.status === "done" ? new Date().toISOString() : null;
    await mutate(`/api/commitments/items/${editingItemId}`, {
      method: "PATCH",
      body: {
        title: itemForm.title,
        notes: itemForm.notes || null,
        evidenceNotes: itemForm.evidenceNotes || null,
        status: itemForm.status,
        dueDate: itemForm.dueDate || null,
        completedAt,
      },
    });
    setEditingItemId(null);
    setItemForm(null);
  };

  const startEditOutcome = (outcome: CommitmentOutcomePrimitives) => {
    if (isEmpty) return;
    setEditingOutcomeId(outcome.id);
    setOutcomeForm({
      title: outcome.title,
      description: outcome.description ?? "",
      type: outcome.type,
      status: outcome.status,
      amount: outcome.amount?.toString() ?? "",
      currency: outcome.currency ?? "EUR",
    });
  };

  const saveOutcome = async () => {
    if (!editingOutcomeId || !outcomeForm || !outcomeForm.title.trim()) return;
    const decidedAt = outcomeForm.status !== "expected" ? new Date().toISOString() : null;
    await mutate(`/api/commitments/outcomes/${editingOutcomeId}`, {
      method: "PATCH",
      body: {
        title: outcomeForm.title,
        description: outcomeForm.description || null,
        type: outcomeForm.type,
        status: outcomeForm.status,
        amount: outcomeForm.amount ? Number(outcomeForm.amount) : null,
        currency: outcomeForm.currency || null,
        decidedAt,
      },
    });
    setEditingOutcomeId(null);
    setOutcomeForm(null);
  };

  const createItem = async () => {
    if (!selected || !newItemTitle.trim() || isEmpty) return;
    await mutate(`/api/commitments/${selected.id}/items`, {
      method: "POST",
      body: { title: newItemTitle, orderIndex: selected.items.length },
    });
    setNewItemTitle("");
  };

  const createOutcome = async () => {
    if (!selected || !newOutcomeTitle.trim() || isEmpty) return;
    await mutate(`/api/commitments/${selected.id}/outcomes`, {
      method: "POST",
      body: { title: newOutcomeTitle, type: newOutcomeType, status: "expected" },
    });
    setNewOutcomeTitle("");
  };

  const updateOutcomeStatus = async (outcome: CommitmentOutcomePrimitives, status: CommitmentOutcomeStatus) => {
    if (isEmpty) return;
    await mutate(`/api/commitments/outcomes/${outcome.id}`, {
      method: "PATCH",
      body: { status, decidedAt: status === "expected" ? null : new Date().toISOString() },
    });
  };

  const deleteItem = async (item: CommitmentItemPrimitives) => {
    if (isEmpty || !window.confirm("Delete this action item?")) return;
    await mutate(`/api/commitments/items/${item.id}`, { method: "DELETE" });
  };

  const deleteOutcome = async (outcome: CommitmentOutcomePrimitives) => {
    if (isEmpty || !window.confirm("Delete this outcome?")) return;
    await mutate(`/api/commitments/outcomes/${outcome.id}`, { method: "DELETE" });
  };

  const deleteCommitment = async () => {
    if (!selected || isEmpty || !window.confirm("Delete this objective?")) return;
    await mutate(`/api/commitments/${selected.id}`, { method: "DELETE" });
    setSelectedId(null);
  };

  const mutate = async (url: string, options: { method: string; body?: Record<string, unknown> }) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: options.method,
        headers: options.body ? { "Content-Type": "application/json" } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errors.saveChanges"));
      await fetchWorkspace(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const selectedContext = selected ? visibleContexts.find((context) => context.id === selected.contextId) : null;
  const doneCount = selected?.items.filter((item) => item.status === "done").length ?? 0;
  const totalItems = selected?.items.length ?? 0;
  const completion = totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100);
  const statusLabel = (status: CommitmentStatus) => t(`status.${status}`);
  const itemStatusLabel = (status: CommitmentItemStatus) => t(`itemStatus.${status}`);
  const outcomeLabel = (type: CommitmentOutcomeType) => t(`outcomeTypes.${type}`);
  const outcomeStatusLabel = (status: CommitmentOutcomeStatus) => t(`outcomeStatus.${status}`);
  const priorityLabel = (priority: CommitmentPriority) => t(`priority.${priority}`);
  const sourceLabel = (source: CommitmentSource) => t(`source.${source}`);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden text-zinc-100">
      <header className="shrink-0 border-b border-white/[0.06] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-50">
            <Target className="h-6 w-6 text-zinc-400" />
            {t("title")}
          </h1>
          <button
            type="button"
            onClick={startCreate}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-[0_0_30px_rgba(110,231,183,0.18)] transition-colors hover:bg-emerald-200 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {t("newObjective")}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 border-b border-white/10 bg-black/10 lg:w-[340px] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 border-b border-white/10 p-3">
            {(["open", "all", "closed"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === item ? "bg-emerald-300/15 text-emerald-200" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                {t(`filters.${item}`)}
              </button>
            ))}
          </div>
          <div className="max-h-[34vh] overflow-y-auto p-3 lg:max-h-none">
            {!hasLoadedWorkspace ? (
              <ObjectivesSidebarSkeleton />
            ) : visibleContexts.map((context) => {
              const group = filteredCommitments.filter((commitment) => commitment.contextId === context.id);
              if (group.length === 0) return null;
              return (
                <section key={context.id} className="mb-5">
                  <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    <span>{context.name}</span>
                    <span>{group.length}</span>
                  </div>
                  <div className="space-y-2">
                    {group.map((commitment) => {
                      const active = commitment.id === selected?.id;
                      const done = commitment.items.filter((item) => item.status === "done").length;
                      return (
                        <button
                          key={commitment.id}
                          onClick={() => {
                            setSelectedId(commitment.id);
                            setForm(null);
                            setEditingItemId(null);
                            setEditingOutcomeId(null);
                          }}
                          className={`w-full rounded-lg border p-3 text-left transition-all ${
                            active
                              ? "border-emerald-300/40 bg-emerald-300/10 shadow-[0_0_24px_rgba(110,231,183,0.08)]"
                              : "border-white/8 bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-2 text-sm font-semibold text-zinc-100">{commitment.title}</p>
                            <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-emerald-200" : "text-zinc-600"}`} />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                            <span className={statusClass(commitment.status)}>{statusLabel(commitment.status)}</span>
                            <span>{t("doneCount", { done, total: commitment.items.length })}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-y-auto p-5 lg:p-8">
          {error && <div className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}

          {!hasLoadedWorkspace ? (
            <ObjectivesDetailSkeleton />
          ) : form ? (
            /* ── Commitment create/edit form ── */
            <section className="rounded-xl border border-emerald-200/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{isCreating ? t("newObjective") : t("editObjective")}</h2>
                <button onClick={() => setForm(null)} className="rounded-md p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-zinc-500">{t("fields.title")}</span>
                  <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">{t("fields.context")}</span>
                    <select className={`${selectClass} w-full`} value={form.contextId} onChange={(e) => setForm({ ...form, contextId: e.target.value })}>
                      {contexts.map((ctx) => <option key={ctx.id} value={ctx.id}>{ctx.name}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-zinc-500">{t("fields.newContext")}</span>
                      <input className={inputClass} placeholder={t("placeholders.context")} value={contextDraft.name} onChange={(e) => setContextDraft({ ...contextDraft, name: e.target.value })} />
                    </label>
                    <button type="button" onClick={createContext} className="mt-6 rounded-md border border-white/10 px-3 text-sm text-zinc-300 hover:bg-white/5">{t("actions.add")}</button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">{t("fields.source")}</span>
                    <select className={`${selectClass} w-full`} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as CommitmentSource })}>
                      {["manager", "self", "company", "project", "other"].map((s) => <option key={s} value={s}>{sourceLabel(s as CommitmentSource)}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">{t("fields.status")}</span>
                    <select className={`${selectClass} w-full`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CommitmentStatus })}>
                      {Object.keys(statusLabels).map((s) => <option key={s} value={s}>{statusLabel(s as CommitmentStatus)}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">{t("fields.priority")}</span>
                    <select className={`${selectClass} w-full`} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as "" | CommitmentPriority })}>
                      <option value="">{t("priority.none")}</option>
                      <option value="low">{t("priority.low")}</option>
                      <option value="medium">{t("priority.medium")}</option>
                      <option value="high">{t("priority.high")}</option>
                    </select>
                  </label>
                  <div />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">{t("fields.startDate")}</span>
                    <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-500">{t("fields.targetDate")}</span>
                    <input type="date" className={inputClass} value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-zinc-500">{t("fields.description")}</span>
                  <textarea className={textareaClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-zinc-500">{t("fields.successCriteria")}</span>
                  <textarea className={textareaClass} rows={2} value={form.successCriteria} onChange={(e) => setForm({ ...form, successCriteria: e.target.value })} placeholder={t("placeholders.successCriteria")} />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-amber-300/80">{t("fields.resultNotes")}</span>
                  <textarea className={textareaClass} rows={2} value={form.resultNotes} onChange={(e) => setForm({ ...form, resultNotes: e.target.value })} placeholder={t("placeholders.resultNotes")} />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setForm(null)} className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:bg-white/5">{t("actions.cancel")}</button>
                <button onClick={saveCommitment} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-200 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("actions.save")}
                </button>
              </div>
            </section>
          ) : selected ? (
            /* ── Detail view ── */
            <section className="w-full">

              {/* Header card */}
              <div className="rounded-xl border border-emerald-200/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(255,255,255,0.025)_42%,rgba(245,158,11,0.06))] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={statusClass(selected.status)}>{statusLabel(selected.status)}</span>
                      {selected.priority && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-amber-200">{t("priorityBadge", { priority: priorityLabel(selected.priority) })}</span>}
                      <span className="text-zinc-500">{selectedContext?.name}</span>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 lg:text-3xl">{selected.title}</h2>
                    {selected.description && <p className="mt-3 text-sm leading-relaxed text-zinc-400">{selected.description}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(selected)} disabled={isEmpty} className="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-40">{t("actions.edit")}</button>
                    <button onClick={deleteCommitment} disabled={isEmpty} className="rounded-md border border-rose-400/20 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                {/* Meta: dates, success criteria, result notes */}
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
                  {selected.startDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("started", { date: formatDate(selected.startDate) })}
                    </span>
                  )}
                  {selected.targetDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-amber-400/60" />
                      {t("target", { date: formatDate(selected.targetDate) })}
                    </span>
                  )}
                  {selected.source && selected.source !== "self" && (
                    <span>{t("sourceLabel", { source: sourceLabel(selected.source) })}</span>
                  )}
                </div>

                {selected.successCriteria && (
                  <div className="mt-4 rounded-lg border border-emerald-300/10 bg-emerald-300/[0.04] px-4 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300/60">{t("fields.successCriteria")}</p>
                    <p className="text-sm leading-relaxed text-zinc-300">{selected.successCriteria}</p>
                  </div>
                )}

                {selected.resultNotes && (
                  <div className="mt-3 rounded-lg border border-amber-300/10 bg-amber-300/[0.04] px-4 py-3">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300/60">{t("fields.result")}</p>
                    <p className="text-sm leading-relaxed text-zinc-300">{selected.resultNotes}</p>
                  </div>
                )}
              </div>

              {/* Action items */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-200">{t("items.title")}</h3>
                  <span className="text-xs text-zinc-500">{t("items.progress", { done: doneCount, total: totalItems, completion })}</span>
                </div>
                <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${completion}%` }} />
                </div>

                <div className="space-y-2">
                  {selected.items.map((item) => {
                    const isEditing = editingItemId === item.id && itemForm;
                    return (
                      <div key={item.id} className="group rounded-lg border border-white/10 bg-black/20">
                        {isEditing && itemForm ? (
                          /* Inline item edit */
                          <div className="space-y-3 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-emerald-300/70">{t("items.edit")}</span>
                              <button onClick={() => { setEditingItemId(null); setItemForm(null); }} className="text-zinc-500 hover:text-zinc-200"><X className="h-4 w-4" /></button>
                            </div>
                            <input className={inputClass} value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} placeholder={t("fields.title")} />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="space-y-1">
                                <span className="text-[11px] text-zinc-500">{t("fields.status")}</span>
                                <select className={`${selectClass} w-full`} value={itemForm.status} onChange={(e) => setItemForm({ ...itemForm, status: e.target.value as CommitmentItemStatus })}>
                                  {Object.keys(itemStatusLabels).map((k) => <option key={k} value={k}>{itemStatusLabel(k as CommitmentItemStatus)}</option>)}
                                </select>
                              </label>
                              <label className="space-y-1">
                                <span className="text-[11px] text-zinc-500">{t("fields.dueDate")}</span>
                                <input type="date" className={inputClass} value={itemForm.dueDate} onChange={(e) => setItemForm({ ...itemForm, dueDate: e.target.value })} />
                              </label>
                            </div>
                            <label className="block space-y-1">
                              <span className="text-[11px] text-zinc-500">{t("fields.notes")}</span>
                              <textarea className={textareaClass} rows={2} value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} placeholder={t("placeholders.itemNotes")} />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-[11px] text-zinc-500">{t("fields.evidence")}</span>
                              <textarea className={textareaClass} rows={2} value={itemForm.evidenceNotes} onChange={(e) => setItemForm({ ...itemForm, evidenceNotes: e.target.value })} placeholder={t("placeholders.evidence")} />
                            </label>
                            <div className="flex justify-end gap-2 pt-1">
                              <button onClick={() => { setEditingItemId(null); setItemForm(null); }} className="rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5">{t("actions.cancel")}</button>
                              <button onClick={saveItem} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-200 disabled:opacity-60">
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                {t("actions.save")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Item display row */
                          <div className="flex items-start gap-3 p-3">
                            <button onClick={() => updateItemStatus(item, item.status === "done" ? "todo" : "done")} className="mt-0.5 shrink-0 text-emerald-200">
                              {item.status === "done" ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium ${item.status === "done" ? "text-zinc-500 line-through" : "text-zinc-100"}`}>{item.title}</p>
                              {(item.notes || item.evidenceNotes || item.dueDate) && (
                                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                                  {item.dueDate && (
                                    <span className="inline-flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(item.dueDate)}
                                    </span>
                                  )}
                                  {item.notes && <span className="text-zinc-500">{item.notes}</span>}
                                </div>
                              )}
                              {item.evidenceNotes && <p className="mt-1 text-xs italic text-zinc-600">{item.evidenceNotes}</p>}
                            </div>
                            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button onClick={() => startEditItem(item)} className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => deleteItem(item)} className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-rose-400">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    className={inputClass}
                    placeholder={t("items.addPlaceholder")}
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void createItem(); }}
                    disabled={isEmpty}
                  />
                  <button onClick={createItem} disabled={saving || isEmpty} className="shrink-0 rounded-md bg-emerald-300 px-3 text-sm font-semibold text-emerald-950 disabled:opacity-40">{t("actions.add")}</button>
                </div>
              </div>

              {/* Outcomes */}
              <div className="mt-8">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-100">
                  <Trophy className="h-4 w-4 text-amber-300/60" />
                  {t("outcomes.title")}
                </h3>

                <div className="space-y-2">
                  {selected.outcomes.map((outcome) => {
                    const isEditing = editingOutcomeId === outcome.id && outcomeForm;
                    return (
                      <div key={outcome.id} className="group rounded-lg border border-amber-300/15 bg-amber-300/[0.04]">
                        {isEditing && outcomeForm ? (
                          /* Inline outcome edit */
                          <div className="space-y-3 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-amber-300/70">{t("outcomes.edit")}</span>
                              <button onClick={() => { setEditingOutcomeId(null); setOutcomeForm(null); }} className="text-zinc-500 hover:text-zinc-200"><X className="h-4 w-4" /></button>
                            </div>
                            <input className={inputClass} value={outcomeForm.title} onChange={(e) => setOutcomeForm({ ...outcomeForm, title: e.target.value })} placeholder={t("outcomes.titlePlaceholder")} />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="space-y-1">
                                <span className="text-[11px] text-zinc-500">{t("fields.type")}</span>
                                <select className={`${selectClass} w-full`} value={outcomeForm.type} onChange={(e) => setOutcomeForm({ ...outcomeForm, type: e.target.value as CommitmentOutcomeType })}>
                                  {Object.keys(outcomeLabels).map((k) => <option key={k} value={k}>{outcomeLabel(k as CommitmentOutcomeType)}</option>)}
                                </select>
                              </label>
                              <label className="space-y-1">
                                <span className="text-[11px] text-zinc-500">{t("fields.status")}</span>
                                <select className={`${selectClass} w-full`} value={outcomeForm.status} onChange={(e) => setOutcomeForm({ ...outcomeForm, status: e.target.value as CommitmentOutcomeStatus })}>
                                  {["expected", "achieved", "missed"].map((s) => <option key={s} value={s}>{outcomeStatusLabel(s as CommitmentOutcomeStatus)}</option>)}
                                </select>
                              </label>
                            </div>
                            {(outcomeForm.type === "money" || outcomeForm.amount) && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <label className="space-y-1">
                                  <span className="text-[11px] text-zinc-500">{t("fields.amount")}</span>
                                  <input type="number" className={inputClass} value={outcomeForm.amount} onChange={(e) => setOutcomeForm({ ...outcomeForm, amount: e.target.value })} placeholder="0" />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-[11px] text-zinc-500">{t("fields.currency")}</span>
                                  <input className={inputClass} value={outcomeForm.currency} onChange={(e) => setOutcomeForm({ ...outcomeForm, currency: e.target.value })} placeholder="EUR" />
                                </label>
                              </div>
                            )}
                            <label className="block space-y-1">
                              <span className="text-[11px] text-zinc-500">{t("fields.description")}</span>
                              <textarea className={textareaClass} rows={2} value={outcomeForm.description} onChange={(e) => setOutcomeForm({ ...outcomeForm, description: e.target.value })} placeholder={t("outcomes.descriptionPlaceholder")} />
                            </label>
                            <div className="flex justify-end gap-2 pt-1">
                              <button onClick={() => { setEditingOutcomeId(null); setOutcomeForm(null); }} className="rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5">{t("actions.cancel")}</button>
                              <button onClick={saveOutcome} disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-200 disabled:opacity-60">
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                {t("actions.save")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Outcome display row */
                          <div className="flex items-start gap-3 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-amber-50">{outcome.title}</p>
                              {outcome.description && <p className="mt-1 text-xs leading-relaxed text-amber-100/50">{outcome.description}</p>}
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-amber-100/40">
                                <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-2 py-0.5">{outcomeLabel(outcome.type)}</span>
                                <span>{outcomeStatusLabel(outcome.status)}</span>
                                {outcome.amount != null && <span>{outcome.amount} {outcome.currency}</span>}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <select
                                className="rounded-md border border-amber-300/20 bg-black/20 px-2 py-1 text-xs text-amber-50"
                                value={outcome.status}
                                onChange={(e) => updateOutcomeStatus(outcome, e.target.value as CommitmentOutcomeStatus)}
                                disabled={isEmpty}
                              >
                                {["expected", "achieved", "missed"].map((s) => <option key={s} value={s}>{outcomeStatusLabel(s as CommitmentOutcomeStatus)}</option>)}
                              </select>
                              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                <button onClick={() => startEditOutcome(outcome)} className="rounded p-1 text-amber-200/40 hover:bg-white/5 hover:text-amber-100">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => deleteOutcome(outcome)} className="rounded p-1 text-amber-200/40 hover:bg-white/5 hover:text-rose-400">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2">
                  <select className={`${selectClass} shrink-0 px-2 py-1.5`} value={newOutcomeType} onChange={(e) => setNewOutcomeType(e.target.value as CommitmentOutcomeType)} disabled={isEmpty}>
                    {Object.keys(outcomeLabels).map((key) => <option key={key} value={key}>{outcomeLabel(key as CommitmentOutcomeType)}</option>)}
                  </select>
                  <input
                    className={inputClass}
                    placeholder={t("outcomes.addPlaceholder")}
                    value={newOutcomeTitle}
                    onChange={(e) => setNewOutcomeTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void createOutcome(); }}
                    disabled={isEmpty}
                  />
                  <button onClick={createOutcome} disabled={saving || isEmpty} className="shrink-0 rounded-md bg-amber-300 px-3 text-sm font-semibold text-amber-950 disabled:opacity-40">{t("actions.add")}</button>
                </div>
              </div>
            </section>
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-zinc-500">{t("emptySelection")}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function statusClass(status: CommitmentStatus): string {
  const base = "rounded-full border px-2 py-1 text-[11px] font-semibold";
  if (status === "achieved") return `${base} border-emerald-300/25 bg-emerald-300/10 text-emerald-200`;
  if (status === "active") return `${base} border-sky-300/20 bg-sky-300/10 text-sky-200`;
  if (status === "paused") return `${base} border-zinc-300/15 bg-zinc-300/10 text-zinc-300`;
  if (status === "missed") return `${base} border-rose-300/20 bg-rose-300/10 text-rose-200`;
  return `${base} border-zinc-500/20 bg-zinc-500/10 text-zinc-400`;
}
