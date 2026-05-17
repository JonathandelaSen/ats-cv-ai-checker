"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
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
import type {
  WorkJournalContext,
  WorkJournalContextSuggestion,
  ContextType as WorkJournalContextType,
  WorkJournalEntry,
  EntryInputMode as WorkJournalEntryInputMode,
} from "@/modules/work-journal";
import { buildWorkJournalEntryDraftPrompt } from "@/modules/work-journal/client";
import { getErrorMessage } from "@/lib/errors";
import { CopyPromptModal } from "@/components/shared/copy-prompt-modal";
import { WorkJournalSkeleton } from "./work-journal-skeleton";
import { Clipboard } from "lucide-react";

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
  "w-full bg-transparent border-b border-white/10 px-0 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0";
const labelClass = "text-xs font-medium text-zinc-500 mb-1 block";

export default function WorkJournalView({
  geminiApiKey,
  hasGeminiApiKey,
  onOpenSettings,
}: WorkJournalViewProps) {
  const t = useTranslations("workJournal");
  const common = useTranslations("common.actions");
  const [contexts, setContexts] = useState<WorkJournalContext[]>([]);
  const [suggestions, setSuggestions] = useState<WorkJournalContextSuggestion[]>([]);
  const [entries, setEntries] = useState<WorkJournalEntry[]>([]);
  const [draft, setDraft] = useState(emptyEntryDraft);
  const [newContextName, setNewContextName] = useState("");
  const [newContextType, setNewContextType] =
    useState<WorkJournalContextType>("employment");
  const [search, setSearch] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contextFilter, setContextFilter] = useState<string>("");
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copiedPromptContent, setCopiedPromptContent] = useState("");

  const activeContexts = contexts.filter((context) => context.status === "active");

  const filteredEntries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (contextFilter && entry.context_id !== contextFilter) return false;
      if (!needle) return true;
      return [entry.topic, entry.raw_notes, entry.final_text, entry.context?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [contextFilter, entries, search]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contextRes, entriesRes] = await Promise.all([
        fetch("/api/work-journal/contexts"),
        fetch("/api/work-journal/entries"),
      ]);
      const contextData = await contextRes.json();
      const entriesData = await entriesRes.json();
      if (!contextRes.ok) {
        throw new Error(contextData.error || t("errors.loadContexts"));
      }
      if (!entriesRes.ok) {
        throw new Error(entriesData.error || t("errors.loadEntries"));
      }

      const loadedContexts = (contextData.contexts ?? []) as WorkJournalContext[];
      setContexts(loadedContexts);
      setSuggestions(contextData.suggestions ?? []);
      setEntries(entriesData);

      const defaultContext =
        loadedContexts.find(
          (context) => context.is_default && context.status === "active"
        ) ?? loadedContexts.find((context) => context.status === "active") ?? null;
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
      setError(data.error || t("errors.createContext"));
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
      setError(data.error || t("errors.useSuggestion"));
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
      setError(t("errors.requiredFields"));
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
      setError(data.error || t("errors.saveEntry"));
      return;
    }

    setDraft((current) => ({
      ...emptyEntryDraft,
      context_id: current.context_id,
      date_start: today(),
    }));
    setShowForm(false);
    await fetchAll();
  };

  const draftWithAI = async () => {
    if (!hasGeminiApiKey) {
      onOpenSettings();
      return;
    }
    if (!draft.context_id || !draft.raw_notes.trim()) {
      setError(t("errors.aiDraftRequired"));
      return;
    }

    setAiLoading(true);
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
      if (!res.ok) throw new Error(data.error || t("errors.aiDraft"));
      setDraft((current) => ({ ...current, final_text: data.final_text }));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  };

  const copyPrompt = async () => {
    if (!draft.context_id || !draft.raw_notes.trim()) return;
    const selectedContext = contexts.find((c) => c.id === draft.context_id);
    if (!selectedContext) return;

    const prompt = buildWorkJournalEntryDraftPrompt({
      context: {
        type: selectedContext.type,
        name: selectedContext.name,
        roleOrLabel: selectedContext.role_or_label,
      },
      dateStart: draft.date_start,
      dateEnd: draft.date_end || null,
      topic: draft.topic || null,
      notes: draft.raw_notes,
    }, true);

    await navigator.clipboard.writeText(prompt);
    setCopiedPromptContent(prompt);
    setIsCopyModalOpen(true);
  };

  const patchEntry = async (
    entry: WorkJournalEntry,
    updates: Partial<WorkJournalEntry>
  ) => {
    const res = await fetch(`/api/work-journal/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t("errors.updateEntry"));
      return;
    }
    setEditingEntryId(null);
    await fetchAll();
  };

  const deleteEntry = async (entry: WorkJournalEntry) => {
    if (!confirm(t("errors.confirmDelete"))) return;
    await fetch(`/api/work-journal/entries/${entry.id}`, { method: "DELETE" });
    await fetchAll();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 md:px-16 lg:px-24 py-12 pb-32">
      <div className="flex flex-col w-full">
        {/* Header */}
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-8 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-light tracking-tight text-zinc-50">
              {t("title")}
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            <div className="relative group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 transition-colors group-focus-within:text-zinc-300" />
              <input 
                placeholder={t("searchPlaceholder")}
                className="pl-7 pr-4 py-2 bg-transparent border-b border-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-white/20 outline-none w-48 transition-all focus:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="h-4 w-px bg-white/10 hidden md:block" />

            <select
              className="bg-transparent text-sm font-medium text-zinc-400 hover:text-zinc-200 border-none focus:ring-0 outline-none cursor-pointer transition-colors"
              value={contextFilter}
              onChange={(e) => setContextFilter(e.target.value)}
            >
              <option value="" className="bg-zinc-900">{t("allContexts")}</option>
              {activeContexts.map((context) => (
                <option key={`filter-${context.id}`} value={context.id} className="bg-zinc-900">
                  {context.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors px-4 py-2 rounded-full ${showForm ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-black hover:bg-zinc-200"}`}
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? t("close") : t("newEntry")}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-8 text-sm text-rose-400 bg-rose-500/10 px-4 py-3 rounded-lg border border-rose-500/20">
            {error}
          </div>
        )}

        {/* Animated Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pb-16 pt-4 mb-8 border-b border-white/5">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 lg:gap-24">
                  
                  {/* Left Col: Editor */}
                  <div className="space-y-6">
                    <div className="flex gap-4 mb-2">
                      {(["manual", "ai_assisted"] as WorkJournalEntryInputMode[]).map(
                        (mode) => (
                          <button
                            key={`mode-${mode}`}
                            type="button"
                            onClick={() =>
                              setDraft((current) => ({ ...current, input_mode: mode }))
                            }
                            className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                              draft.input_mode === mode
                                ? "text-zinc-100 border-zinc-100"
                                : "text-zinc-600 border-transparent hover:text-zinc-400"
                            }`}
                          >
                            {mode === "manual" ? t("freeWriting") : t("aiWriting")}
                          </button>
                        )
                      )}
                    </div>

                    <textarea
                      className="w-full bg-transparent text-xl font-light leading-relaxed text-zinc-200 placeholder:text-zinc-700 outline-none resize-none min-h-[160px]"
                      placeholder={t("notesPlaceholder")}
                      value={draft.raw_notes}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, raw_notes: event.target.value }))
                      }
                    />

                    {draft.input_mode === "ai_assisted" && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={draftWithAI}
                            disabled={aiLoading}
                            className="inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors disabled:opacity-50"
                          >
                            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            {t("generateProfessionalDraft")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyPrompt()}
                            disabled={!draft.raw_notes.trim() || !draft.context_id}
                            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors disabled:opacity-50"
                          >
                            <Clipboard className="h-4 w-4" />
                            {t("copyAiPrompt")}
                          </button>
                        </div>
                        
                        {draft.final_text && (
                          <textarea
                            className="w-full bg-teal-950/20 text-teal-50/90 rounded-xl p-4 text-base leading-relaxed outline-none resize-none min-h-[160px] border border-teal-900/50"
                            value={draft.final_text}
                            onChange={(event) =>
                              setDraft((current) => ({ ...current, final_text: event.target.value }))
                            }
                          />
                        )}
                      </motion.div>
                    )}

                    <div className="flex items-center gap-4 pt-6">
                      <button
                        type="button"
                        onClick={saveEntry}
                        className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-zinc-200 transition-colors flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {t("saveEntry")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {common("cancel")}
                      </button>
                    </div>
                  </div>

                  {/* Right Col: Metadata & Context */}
                  <div className="space-y-8">
                    <div>
                      <label className={labelClass}>{t("context")}</label>
                      <select
                        className={inputClass}
                        value={draft.context_id}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, context_id: event.target.value }))
                        }
                      >
                        <option value="" disabled className="bg-zinc-900 text-zinc-500">{t("selectContext")}</option>
                        {activeContexts.map((context) => (
                          <option key={`form-ctx-${context.id}`} value={context.id} className="bg-zinc-900 text-zinc-200">
                            {context.name} {context.type === 'project' ? t("projectSuffix") : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>{t("dateFrom")}</label>
                        <input
                          type="date"
                          className={inputClass}
                          value={draft.date_start}
                          onChange={(event) => setDraft((current) => ({ ...current, date_start: event.target.value }))}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t("dateTo")}</label>
                        <input
                          type="date"
                          className={inputClass}
                          value={draft.date_end}
                          onChange={(event) => setDraft((current) => ({ ...current, date_end: event.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>{t("topic")}</label>
                      <input
                        className={inputClass}
                        placeholder={t("topicPlaceholder")}
                        value={draft.topic}
                        onChange={(event) => setDraft((current) => ({ ...current, topic: event.target.value }))}
                      />
                    </div>

                    {/* Create new context subtly integrated */}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                      <p className="text-xs font-medium text-zinc-500">{t("createContext")}</p>
                      <div className="flex gap-2">
                        <select
                          className="bg-transparent border-b border-white/10 text-sm text-zinc-400 focus:border-zinc-300 focus:ring-0 outline-none w-24 py-1"
                          value={newContextType}
                          onChange={(e) => setNewContextType(e.target.value as WorkJournalContextType)}
                        >
                          <option value="employment" className="bg-zinc-900">{t("contextTypes.employment")}</option>
                          <option value="project" className="bg-zinc-900">{t("contextTypes.project")}</option>
                        </select>
                        <input
                          className="flex-1 bg-transparent border-b border-white/10 text-sm text-zinc-100 placeholder:text-zinc-700 focus:border-zinc-300 focus:ring-0 outline-none py-1"
                          placeholder={t("contextNamePlaceholder")}
                          value={newContextName}
                          onChange={(e) => setNewContextName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && void createContext()}
                        />
                        <button
                          type="button"
                          onClick={() => void createContext()}
                          className="text-zinc-400 hover:text-white transition-colors p-1"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="pt-6 border-t border-white/5 space-y-3">
                         <p className="text-xs font-medium text-zinc-500">{t("suggestions")}</p>
                         <div className="flex flex-wrap gap-2">
                           {suggestions.slice(0, 3).map((suggestion) => (
                              <div key={`sugg-${suggestion.name}`} className="flex items-center gap-1 bg-white/5 rounded-full pl-3 pr-1 py-1">
                                 <span className="text-xs text-zinc-300 truncate max-w-[120px]">{suggestion.name}</span>
                                 <button onClick={() => void promoteSuggestion(suggestion)} className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white">
                                    <Check className="h-3 w-3" />
                                 </button>
                                 <button onClick={() => void hideSuggestion(suggestion)} className="p-1 hover:bg-white/10 rounded-full text-zinc-500 hover:text-rose-400">
                                    <X className="h-3 w-3" />
                                 </button>
                              </div>
                           ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        <div className="pl-4 md:pl-8 py-4 relative">
          {loading ? (
            <WorkJournalSkeleton />
          ) : filteredEntries.length === 0 ? (
            <EmptyState icon={FilePenLine} text={t("empty")} />
          ) : (
            filteredEntries.map((entry, index) => (
              <TimelineEntry
                key={`${entry.id}:${entry.updated_at}:${editingEntryId === entry.id ? "editing" : "view"}`}
                entry={entry}
                isLast={index === filteredEntries.length - 1}
                isEditing={editingEntryId === entry.id}
                onEdit={() => setEditingEntryId(entry.id)}
                onCancel={() => setEditingEntryId(null)}
                onSave={(updates) => patchEntry(entry, updates)}
                onDelete={() => void deleteEntry(entry)}
              />
            ))
          )}
        </div>
      </div>
      
      <CopyPromptModal 
        isOpen={isCopyModalOpen} 
        onClose={() => setIsCopyModalOpen(false)} 
        title={t("promptCopiedTitle")}
        message={t("promptCopiedMessage")}
        promptContent={copiedPromptContent}
      />
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
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-zinc-600">
      <Icon className="h-8 w-8 stroke-1 text-zinc-700" />
      <p className="text-sm font-light tracking-wide">{text}</p>
    </div>
  );
}

function TimelineEntry({
  entry,
  isLast,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  entry: WorkJournalEntry;
  isLast: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: Partial<WorkJournalEntry>) => void;
  onDelete: () => void;
}) {
  const t = useTranslations("workJournal");
  const common = useTranslations("common.actions");
  const [edit, setEdit] = useState(entry);

  if (isEditing) {
    return (
      <div className="relative pl-10 md:pl-16 pb-12 group">
        {!isLast && <div className="absolute left-[11px] md:left-[19px] top-6 bottom-[-2rem] w-px bg-white/5" />}
        <div className="absolute left-0 md:left-2 top-1.5 h-6 w-6 rounded-full bg-black border-[3px] border-zinc-800 flex items-center justify-center z-10" />
        
        <div className="space-y-6 w-full">
          <div className="flex flex-wrap gap-4">
             <input type="date" className="bg-transparent border-b border-zinc-700 text-sm text-zinc-200 outline-none pb-1" value={edit.date_start} onChange={e => setEdit({...edit, date_start: e.target.value})} />
             <input type="date" className="bg-transparent border-b border-zinc-700 text-sm text-zinc-200 outline-none pb-1" value={edit.date_end || ''} onChange={e => setEdit({...edit, date_end: e.target.value || null})} />
             <input placeholder={t("editTopicPlaceholder")} className="bg-transparent border-b border-zinc-700 text-sm text-zinc-200 outline-none pb-1 flex-1 min-w-[200px]" value={edit.topic || ''} onChange={e => setEdit({...edit, topic: e.target.value || null})} />
          </div>
          
          <div className="space-y-4">
             <div>
                <label className="text-xs font-medium text-zinc-500 mb-2 block">{t("finalText")}</label>
                <textarea
                  className="w-full bg-transparent text-[17px] md:text-lg font-light leading-relaxed text-zinc-200 placeholder:text-zinc-700 outline-none resize-y min-h-[240px] border border-white/10 rounded-xl p-4 focus:border-white/20 transition-colors"
                  value={edit.final_text}
                  onChange={(event) => setEdit({ ...edit, final_text: event.target.value })}
                />
             </div>
             
             <div>
                <label className="text-xs font-medium text-zinc-500 mb-2 block">{t("rawNotes")}</label>
                <textarea
                  className="w-full bg-transparent text-[15px] font-light leading-relaxed text-zinc-400 placeholder:text-zinc-700 outline-none resize-y min-h-[120px] border border-white/5 rounded-xl p-4 focus:border-white/20 transition-colors"
                  value={edit.raw_notes}
                  onChange={(event) => setEdit({ ...edit, raw_notes: event.target.value })}
                />
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => onSave(edit)} className="px-4 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-zinc-200 transition-colors">{t("saveChanges")}</button>
             <button onClick={onCancel} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">{common("cancel")}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="relative pl-10 md:pl-16 pb-16 group w-full">
      {!isLast && <div className="absolute left-[11px] md:left-[19px] top-6 bottom-[-1rem] w-px bg-white/[0.08]" />}
      <div className="absolute left-0 md:left-2 top-1.5 h-6 w-6 rounded-full bg-black border-[3px] border-zinc-800 flex items-center justify-center z-10 transition-colors group-hover:border-zinc-600">
         <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 group-hover:bg-zinc-400 transition-colors" />
      </div>

      <div className="flex items-center justify-between mb-3 w-full gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500 tracking-wide">
          <span className="flex items-center gap-1.5">
             <CalendarDays className="h-3.5 w-3.5" />
             {entry.date_start}
             {entry.date_end ? ` → ${entry.date_end}` : ""}
          </span>
          {entry.topic && (
            <>
               <span className="text-zinc-700 hidden sm:inline">•</span>
               <span className="text-zinc-400">{entry.topic}</span>
            </>
          )}
          {entry.context && (
             <>
               <span className="text-zinc-700 hidden sm:inline">•</span>
               <span className="text-zinc-500 opacity-70 flex items-center gap-1">
                  {entry.context.type === 'project' ? <FolderKanban className="h-3 w-3" /> : <BriefcaseBusiness className="h-3 w-3" />}
                  {entry.context.name}
               </span>
             </>
          )}
        </div>

        {/* Actions (fade in on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           <button
             onClick={onEdit}
             className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors"
             title={t("editEntry")}
           >
             <Pencil className="h-3.5 w-3.5" />
           </button>
           <button
             onClick={onDelete}
             className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
             title={t("deleteEntry")}
           >
             <Trash2 className="h-3.5 w-3.5" />
           </button>
        </div>
      </div>

      <div className="relative w-full">
         <p className="text-[17px] md:text-lg font-light text-zinc-200 leading-[1.7] whitespace-pre-wrap w-full">
           {entry.final_text}
         </p>

         {entry.raw_notes !== entry.final_text && (
           <p className="mt-6 border-l-2 border-white/5 pl-4 text-[14px] leading-relaxed text-zinc-500 whitespace-pre-wrap w-full">
             {entry.raw_notes}
           </p>
         )}
      </div>
    </article>
  );
}
