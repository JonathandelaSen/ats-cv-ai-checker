"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  FilePenLine,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  WorkJournalContext,
  WorkJournalContextSuggestion,
  WorkJournalContextType,
  WorkJournalEntry,
  WorkJournalEntryInputMode,
  WorkJournalHighlight,
  WorkJournalHighlightStatus,
} from "@/lib/db";
import { getErrorMessage } from "@/lib/errors";

interface WorkJournalViewProps {
  geminiApiKey: string;
  hasGeminiApiKey: boolean;
  onOpenSettings: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyEntryDraft = {
  context_id: "",
  date_start: today(),
  date_end: "",
  topic: "",
  input_mode: "manual" as WorkJournalEntryInputMode,
  raw_notes: "",
  final_text: "",
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-teal-400/50";
const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-zinc-500";

export default function WorkJournalView({
  geminiApiKey,
  hasGeminiApiKey,
  onOpenSettings,
}: WorkJournalViewProps) {
  const [contexts, setContexts] = useState<WorkJournalContext[]>([]);
  const [suggestions, setSuggestions] = useState<WorkJournalContextSuggestion[]>([]);
  const [entries, setEntries] = useState<WorkJournalEntry[]>([]);
  const [highlights, setHighlights] = useState<WorkJournalHighlight[]>([]);
  const [activeTab, setActiveTab] = useState<"entries" | "highlights">("entries");
  const [draft, setDraft] = useState(emptyEntryDraft);
  const [newContextName, setNewContextName] = useState("");
  const [newContextType, setNewContextType] =
    useState<WorkJournalContextType>("employment");
  const [search, setSearch] = useState("");
  const [highlightStatus, setHighlightStatus] =
    useState<WorkJournalHighlightStatus | "all">("all");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [generateRange, setGenerateRange] = useState({
    from: "",
    to: "",
  });
  const [manualHighlight, setManualHighlight] = useState({
    title: "",
    summary: "",
    bullets: "",
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<"draft" | "highlights" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeContexts = contexts.filter((context) => context.status === "active");
  const selectedContext = activeContexts.find((context) => context.id === draft.context_id) ?? activeContexts[0] ?? null;

  const filteredEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (draft.context_id && entry.context_id !== draft.context_id) return false;
      if (!needle) return true;
      return [entry.topic, entry.raw_notes, entry.final_text, entry.context?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [draft.context_id, entries, search]);

  const filteredHighlights = useMemo(
    () =>
      highlights.filter((highlight) => {
        if (draft.context_id && highlight.context_id !== draft.context_id) return false;
        if (highlightStatus !== "all" && highlight.status !== highlightStatus) return false;
        return true;
      }),
    [draft.context_id, highlightStatus, highlights]
  );

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contextRes, entriesRes, highlightsRes] = await Promise.all([
        fetch("/api/work-journal/contexts"),
        fetch("/api/work-journal/entries"),
        fetch("/api/work-journal/highlights?status=all"),
      ]);
      const contextData = await contextRes.json();
      const entriesData = await entriesRes.json();
      const highlightsData = await highlightsRes.json();
      if (!contextRes.ok) throw new Error(contextData.error || "No se pudieron cargar los contextos");
      if (!entriesRes.ok) throw new Error(entriesData.error || "No se pudieron cargar las entradas");
      if (!highlightsRes.ok) throw new Error(highlightsData.error || "No se pudieron cargar los highlights");
      setContexts(contextData.contexts ?? []);
      setSuggestions(contextData.suggestions ?? []);
      setEntries(entriesData);
      setHighlights(highlightsData);
      const defaultContext =
        (contextData.contexts as WorkJournalContext[] | undefined)?.find((context) => context.is_default && context.status === "active") ??
        (contextData.contexts as WorkJournalContext[] | undefined)?.find((context) => context.status === "active") ??
        null;
      if (defaultContext && !draft.context_id) {
        setDraft((current) => ({ ...current, context_id: defaultContext.id }));
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createContext = async (type = newContextType, name = newContextName) => {
    if (!name.trim()) return;
    setError(null);
    const res = await fetch("/api/work-journal/contexts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name, is_default: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo crear el contexto");
      return;
    }
    setNewContextName("");
    await fetchAll();
    setDraft((current) => ({ ...current, context_id: data.id }));
  };

  const promoteSuggestion = async (suggestion: WorkJournalContextSuggestion) => {
    const res = await fetch("/api/work-journal/contexts/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...suggestion, action: "promote", is_default: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo usar la sugerencia");
      return;
    }
    await fetchAll();
    setDraft((current) => ({ ...current, context_id: data.id }));
  };

  const hideSuggestion = async (suggestion: WorkJournalContextSuggestion) => {
    await fetch("/api/work-journal/contexts/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...suggestion, action: "hide" }),
    });
    await fetchAll();
  };

  const saveEntry = async () => {
    if (!draft.context_id || !draft.raw_notes.trim()) {
      setError("El contexto y las notas son obligatorios.");
      return;
    }
    const finalText =
      draft.input_mode === "manual" ? draft.raw_notes : draft.final_text || draft.raw_notes;
    const res = await fetch("/api/work-journal/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        final_text: finalText,
        date_end: draft.date_end || null,
        topic: draft.topic || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo guardar la entrada");
      return;
    }
    setDraft((current) => ({
      ...emptyEntryDraft,
      context_id: current.context_id,
      date_start: today(),
    }));
    await fetchAll();
  };

  const draftWithAI = async () => {
    if (!hasGeminiApiKey) {
      onOpenSettings();
      return;
    }
    if (!draft.context_id || !draft.raw_notes.trim()) {
      setError("Añade contexto y notas antes de redactar con IA.");
      return;
    }
    setAiLoading("draft");
    setError(null);
    try {
      const res = await fetch("/api/work-journal/entries/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geminiApiKey,
          model: "gemini-3.1-pro-preview",
          context_id: draft.context_id,
          date_start: draft.date_start,
          date_end: draft.date_end || null,
          topic: draft.topic || null,
          notes: draft.raw_notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo redactar con IA");
      setDraft((current) => ({ ...current, final_text: data.final_text }));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setAiLoading(null);
    }
  };

  const patchEntry = async (entry: WorkJournalEntry, updates: Partial<WorkJournalEntry>) => {
    const res = await fetch(`/api/work-journal/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo actualizar la entrada");
      return;
    }
    setEditingEntryId(null);
    await fetchAll();
  };

  const deleteEntry = async (entry: WorkJournalEntry) => {
    if (!confirm("¿Seguro que quieres borrar esta entrada?")) return;
    await fetch(`/api/work-journal/entries/${entry.id}`, { method: "DELETE" });
    await fetchAll();
  };

  const generateHighlights = async () => {
    if (!selectedContext) return;
    if (!hasGeminiApiKey) {
      onOpenSettings();
      return;
    }
    setAiLoading("highlights");
    setError(null);
    try {
      const res = await fetch("/api/work-journal/highlights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geminiApiKey,
          model: "gemini-3.1-pro-preview",
          context_id: selectedContext.id,
          date_from: generateRange.from || null,
          date_to: generateRange.to || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron generar highlights");
      setActiveTab("highlights");
      await fetchAll();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setAiLoading(null);
    }
  };

  const createManualHighlight = async () => {
    if (!selectedContext || !manualHighlight.title.trim() || !manualHighlight.summary.trim()) return;
    const res = await fetch("/api/work-journal/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context_id: selectedContext.id,
        title: manualHighlight.title,
        summary: manualHighlight.summary,
        status: "saved",
        candidate_bullets: manualHighlight.bullets
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo crear el highlight");
      return;
    }
    setManualHighlight({ title: "", summary: "", bullets: "" });
    await fetchAll();
  };

  const patchHighlight = async (
    highlight: WorkJournalHighlight,
    updates: Partial<WorkJournalHighlight>
  ) => {
    const res = await fetch(`/api/work-journal/highlights/${highlight.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo actualizar el highlight");
      return;
    }
    setEditingHighlightId(null);
    await fetchAll();
  };

  const contextIcon = selectedContext?.type === "project" ? FolderKanban : BriefcaseBusiness;
  const ContextIcon = contextIcon;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto flex max-w-7xl flex-col gap-6"
      >
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300/80">
              Diario
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-50">
              Captura trabajo ahora. Convierte evidencia en bullets despues.
            </h1>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />}
        </header>

        {error && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-white/10 bg-[#101018] p-4 shadow-2xl shadow-black/20">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
                <label className="space-y-1.5">
                  <span className={labelClass}>Contexto</span>
                  <select
                    className={inputClass}
                    value={draft.context_id}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, context_id: event.target.value }))
                    }
                  >
                    {activeContexts.map((context) => (
                      <option key={context.id} value={context.id}>
                        {context.name} · {context.type === "employment" ? "Empleo" : "Proyecto"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className={labelClass}>Desde</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={draft.date_start}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, date_start: event.target.value }))
                    }
                  />
                </label>
                <label className="space-y-1.5">
                  <span className={labelClass}>Hasta</span>
                  <input
                    type="date"
                    className={inputClass}
                    value={draft.date_end}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, date_end: event.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="space-y-1.5">
                <span className={labelClass}>Tema opcional</span>
                <input
                  className={inputClass}
                  placeholder="Integracion LTI, performance, onboarding..."
                  value={draft.topic}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, topic: event.target.value }))
                  }
                />
              </label>

              <div className="flex gap-2">
                {(["manual", "ai_assisted"] as WorkJournalEntryInputMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({ ...current, input_mode: mode }))
                    }
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      draft.input_mode === mode
                        ? "bg-teal-500/15 text-teal-200"
                        : "bg-white/[0.04] text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {mode === "manual" ? "Escribir tal cual" : "Ayudame a redactarlo"}
                  </button>
                ))}
              </div>

              <textarea
                className={`${inputClass} min-h-32 resize-y`}
                placeholder="Notas rapidas, bullets sueltos, decisiones, bloqueos, avances..."
                value={draft.raw_notes}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, raw_notes: event.target.value }))
                }
              />

              {draft.input_mode === "ai_assisted" && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={draftWithAI}
                    disabled={aiLoading === "draft"}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-teal-400 disabled:opacity-60"
                  >
                    {aiLoading === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Redactar preview
                  </button>
                  <textarea
                    className={`${inputClass} min-h-32 resize-y border-teal-500/20`}
                    placeholder="Aqui aparecera el preview editable generado por IA."
                    value={draft.final_text}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, final_text: event.target.value }))
                    }
                  />
                </div>
              )}

              <button
                type="button"
                onClick={saveEntry}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                <Save className="h-4 w-4" />
                Guardar entrada
              </button>
            </div>

            <aside className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/15 text-teal-300">
                  <ContextIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {selectedContext?.name ?? "Sin contexto"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {selectedContext?.type === "project" ? "Proyecto" : "Empleo"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[120px_1fr_auto] gap-2">
                <select
                  className={inputClass}
                  value={newContextType}
                  onChange={(event) =>
                    setNewContextType(event.target.value as WorkJournalContextType)
                  }
                >
                  <option value="employment">Empleo</option>
                  <option value="project">Proyecto</option>
                </select>
                <input
                  className={inputClass}
                  placeholder="Nuevo contexto"
                  value={newContextName}
                  onChange={(event) => setNewContextName(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void createContext()}
                  className="rounded-lg bg-white/[0.08] p-2 text-zinc-200 hover:bg-white/[0.12]"
                  title="Crear contexto"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className={labelClass}>Sugeridos desde tus CVs</p>
                  {suggestions.slice(0, 5).map((suggestion) => (
                    <div
                      key={`${suggestion.type}:${suggestion.name}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-zinc-200">{suggestion.name}</p>
                        <p className="text-xs text-zinc-500">
                          {suggestion.type === "employment" ? "Empleo" : "Proyecto"}
                          {suggestion.is_current ? " actual" : ""}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => void promoteSuggestion(suggestion)}
                          className="rounded-md p-1.5 text-teal-300 hover:bg-teal-500/10"
                          title="Usar"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void hideSuggestion(suggestion)}
                          className="rounded-md p-1.5 text-zinc-500 hover:bg-white/[0.06]"
                          title="Ocultar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-white/10 bg-[#101018] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("entries")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === "entries" ? "bg-white text-zinc-950" : "bg-white/[0.05] text-zinc-400"}`}
              >
                Entradas
              </button>
              <button
                onClick={() => setActiveTab("highlights")}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeTab === "highlights" ? "bg-white text-zinc-950" : "bg-white/[0.05] text-zinc-400"}`}
              >
                Highlights
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Buscar"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <input
                type="date"
                className={inputClass}
                value={generateRange.from}
                onChange={(event) =>
                  setGenerateRange((current) => ({ ...current, from: event.target.value }))
                }
              />
              <input
                type="date"
                className={inputClass}
                value={generateRange.to}
                onChange={(event) =>
                  setGenerateRange((current) => ({ ...current, to: event.target.value }))
                }
              />
              <button
                type="button"
                onClick={generateHighlights}
                disabled={aiLoading === "highlights" || !selectedContext}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-teal-400 disabled:opacity-60"
              >
                {aiLoading === "highlights" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generar highlights
              </button>
            </div>
          </div>

          {activeTab === "entries" ? (
            <div className="grid gap-3">
              {filteredEntries.map((entry) => (
                <EntryCard
                  key={`${entry.id}:${entry.updated_at}:${editingEntryId === entry.id ? "editing" : "view"}`}
                  entry={entry}
                  isEditing={editingEntryId === entry.id}
                  onEdit={() => setEditingEntryId(entry.id)}
                  onCancel={() => setEditingEntryId(null)}
                  onSave={(updates) => patchEntry(entry, updates)}
                  onDelete={() => void deleteEntry(entry)}
                />
              ))}
              {filteredEntries.length === 0 && (
                <EmptyState icon={FilePenLine} text="Aun no hay entradas para este contexto." />
              )}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["all", "proposed", "saved", "discarded"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setHighlightStatus(status)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${highlightStatus === status ? "bg-white text-zinc-950" : "bg-white/[0.05] text-zinc-400"}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                {filteredHighlights.map((highlight) => (
                  <HighlightCard
                    key={`${highlight.id}:${highlight.updated_at}:${editingHighlightId === highlight.id ? "editing" : "view"}`}
                    highlight={highlight}
                    isEditing={editingHighlightId === highlight.id}
                    onEdit={() => setEditingHighlightId(highlight.id)}
                    onCancel={() => setEditingHighlightId(null)}
                    onSave={(updates) => patchHighlight(highlight, updates)}
                  />
                ))}
                {filteredHighlights.length === 0 && (
                  <EmptyState icon={Sparkles} text="Genera o crea tu primer highlight." />
                )}
              </div>
              <aside className="space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-zinc-100">Highlight manual</p>
                <input
                  className={inputClass}
                  placeholder="Titulo"
                  value={manualHighlight.title}
                  onChange={(event) =>
                    setManualHighlight((current) => ({ ...current, title: event.target.value }))
                  }
                />
                <textarea
                  className={`${inputClass} min-h-24`}
                  placeholder="Resumen"
                  value={manualHighlight.summary}
                  onChange={(event) =>
                    setManualHighlight((current) => ({ ...current, summary: event.target.value }))
                  }
                />
                <textarea
                  className={`${inputClass} min-h-24`}
                  placeholder="Bullets candidatos, uno por linea"
                  value={manualHighlight.bullets}
                  onChange={(event) =>
                    setManualHighlight((current) => ({ ...current, bullets: event.target.value }))
                  }
                />
                <button
                  onClick={createManualHighlight}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-950"
                >
                  <Plus className="h-4 w-4" />
                  Crear highlight
                </button>
              </aside>
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-lg border border-dashed border-white/10 py-10 text-sm text-zinc-500">
      <Icon className="h-4 w-4" />
      {text}
    </div>
  );
}

function EntryCard({
  entry,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  entry: WorkJournalEntry;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: Partial<WorkJournalEntry>) => void;
  onDelete: () => void;
}) {
  const [edit, setEdit] = useState(entry);

  if (isEditing) {
    return (
      <div className="space-y-3 rounded-lg border border-teal-500/20 bg-teal-500/[0.04] p-4">
        <div className="grid gap-2 md:grid-cols-2">
          <input className={inputClass} type="date" value={edit.date_start} onChange={(event) => setEdit({ ...edit, date_start: event.target.value })} />
          <input className={inputClass} type="date" value={edit.date_end ?? ""} onChange={(event) => setEdit({ ...edit, date_end: event.target.value || null })} />
        </div>
        <input className={inputClass} value={edit.topic ?? ""} onChange={(event) => setEdit({ ...edit, topic: event.target.value || null })} placeholder="Tema" />
        <textarea className={`${inputClass} min-h-24`} value={edit.raw_notes} onChange={(event) => setEdit({ ...edit, raw_notes: event.target.value })} />
        <textarea className={`${inputClass} min-h-24`} value={edit.final_text} onChange={(event) => setEdit({ ...edit, final_text: event.target.value })} />
        <div className="flex gap-2">
          <button onClick={() => onSave(edit)} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-950">Guardar</button>
          <button onClick={onCancel} className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{entry.date_start}{entry.date_end ? ` - ${entry.date_end}` : ""}</span>
            {entry.topic && <span className="rounded-md bg-white/[0.06] px-2 py-0.5">{entry.topic}</span>}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{entry.final_text}</p>
          {entry.raw_notes !== entry.final_text && (
            <p className="mt-3 whitespace-pre-wrap border-l border-white/10 pl-3 text-xs leading-5 text-zinc-500">{entry.raw_notes}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={onEdit} className="rounded-md p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"><Pencil className="h-4 w-4" /></button>
          <button onClick={onDelete} className="rounded-md p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </article>
  );
}

function HighlightCard({
  highlight,
  isEditing,
  onEdit,
  onCancel,
  onSave,
}: {
  highlight: WorkJournalHighlight;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: Partial<WorkJournalHighlight>) => void;
}) {
  const [edit, setEdit] = useState({
    ...highlight,
    candidate_bullets_text: highlight.candidate_bullets.join("\n"),
    follow_up_text: highlight.follow_up_questions.join("\n"),
    evidence_text: highlight.additional_evidence.join("\n"),
  });
  const [answer, setAnswer] = useState("");

  const statusClass = {
    proposed: "bg-amber-500/10 text-amber-300",
    saved: "bg-emerald-500/10 text-emerald-300",
    discarded: "bg-zinc-500/10 text-zinc-400",
  }[highlight.status];

  if (isEditing) {
    return (
      <article className="space-y-3 rounded-lg border border-teal-500/20 bg-teal-500/[0.04] p-4">
        <input className={inputClass} value={edit.title} onChange={(event) => setEdit({ ...edit, title: event.target.value })} />
        <textarea className={`${inputClass} min-h-24`} value={edit.summary} onChange={(event) => setEdit({ ...edit, summary: event.target.value })} />
        <textarea className={`${inputClass} min-h-28`} value={edit.candidate_bullets_text} onChange={(event) => setEdit({ ...edit, candidate_bullets_text: event.target.value })} />
        <textarea className={`${inputClass} min-h-20`} value={edit.follow_up_text} onChange={(event) => setEdit({ ...edit, follow_up_text: event.target.value })} />
        <textarea className={`${inputClass} min-h-20`} value={edit.evidence_text} onChange={(event) => setEdit({ ...edit, evidence_text: event.target.value })} />
        <div className="flex flex-wrap gap-2">
          {(["proposed", "saved", "discarded"] as WorkJournalHighlightStatus[]).map((status) => (
            <button key={status} onClick={() => setEdit({ ...edit, status })} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${edit.status === status ? "bg-white text-zinc-950" : "bg-white/[0.06] text-zinc-400"}`}>{status}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              onSave({
                title: edit.title,
                summary: edit.summary,
                status: edit.status,
                candidate_bullets: edit.candidate_bullets_text.split("\n").map((item) => item.trim()).filter(Boolean),
                follow_up_questions: edit.follow_up_text.split("\n").map((item) => item.trim()).filter(Boolean),
                additional_evidence: edit.evidence_text.split("\n").map((item) => item.trim()).filter(Boolean),
              })
            }
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-950"
          >
            Guardar
          </button>
          <button onClick={onCancel} className="rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-zinc-300">Cancelar</button>
        </div>
      </article>
    );
  }

  return (
    <article className="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-zinc-100">{highlight.title}</h3>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}>{highlight.status}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{highlight.summary}</p>
        </div>
        <button onClick={onEdit} className="rounded-md p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200"><Pencil className="h-4 w-4" /></button>
      </div>
      {highlight.candidate_bullets.length > 0 && (
        <div className="space-y-2">
          <p className={labelClass}>Bullets candidatos</p>
          {highlight.candidate_bullets.map((bullet, index) => (
            <p key={index} className="rounded-lg bg-black/20 px-3 py-2 text-sm text-zinc-300">{bullet}</p>
          ))}
        </div>
      )}
      {highlight.follow_up_questions.length > 0 && (
        <div className="space-y-2">
          <p className={labelClass}>Preguntas para mejorar</p>
          {highlight.follow_up_questions.map((question, index) => (
            <p key={index} className="text-sm text-zinc-400">{question}</p>
          ))}
          <div className="flex gap-2">
            <input className={inputClass} placeholder="Respuesta como evidencia adicional" value={answer} onChange={(event) => setAnswer(event.target.value)} />
            <button
              onClick={() => {
                if (!answer.trim()) return;
                onSave({ additional_evidence: [...highlight.additional_evidence, answer.trim()] });
                setAnswer("");
              }}
              className="rounded-lg bg-white/[0.08] px-3 text-zinc-200"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onSave({ status: "saved" })} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"><Check className="h-3.5 w-3.5" />Guardar</button>
        <button onClick={() => onSave({ status: "discarded" })} className="inline-flex items-center gap-1 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-zinc-400"><Archive className="h-3.5 w-3.5" />Descartar</button>
      </div>
    </article>
  );
}
