"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquareQuote,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { AnalysisSummary } from "@/lib/analysis-types";
import type { CVDocumentSummaryResponse as CVSummary } from "@/modules/cv-library";
import type { ProcessQuestionResponse as InterviewQuestionSummary } from "@/modules/selection-process";
import { getErrorMessage } from "@/lib/errors";

interface InterviewQuestionsViewProps {
  questions: InterviewQuestionSummary[];
  cvs: CVSummary[];
  analyses: AnalysisSummary[];
  geminiApiKey: string;
  hasGeminiApiKey: boolean;
  initialCvId?: string | null;
  initialAnalysisId?: string | null;
  onRefresh: () => Promise<void> | void;
  onOpenSettings: () => void;
  onOpenAnalysis: (id: string) => void;
}

const emptyDraft = {
  question: "",
  context: "",
  answer: "",
  cv_id: "",
  analysis_id: "",
};

export default function InterviewQuestionsView({
  questions,
  cvs,
  analyses,
  geminiApiKey,
  hasGeminiApiKey,
  initialCvId = null,
  initialAnalysisId = null,
  onRefresh,
  onOpenSettings,
  onOpenAnalysis,
}: InterviewQuestionsViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    questions[0]?.id ?? null,
  );
  const [search, setSearch] = useState("");
  const [cvFilter, setCvFilter] = useState(initialCvId ?? "");
  const [analysisFilter, setAnalysisFilter] = useState(initialAnalysisId ?? "");
  const [answeredFilter, setAnsweredFilter] = useState<
    "all" | "answered" | "empty"
  >("all");
  const [draft, setDraft] = useState({
    ...emptyDraft,
    cv_id: initialCvId ?? "",
    analysis_id: initialAnalysisId ?? "",
  });
  const [aiInstruction, setAiInstruction] = useState("");
  const [model, setModel] = useState("gemini-3.1-pro-preview");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<"generate" | "edit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const questionRef = useRef<HTMLTextAreaElement | null>(null);
  const contextRef = useRef<HTMLTextAreaElement | null>(null);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);

  const jobAnalyses = useMemo(
    () => analyses.filter((analysis) => analysis.analysis_mode === "job_match"),
    [analyses],
  );

  const filteredQuestions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return questions.filter((item) => {
      if (cvFilter && item.cv_id !== cvFilter) return false;
      if (analysisFilter && item.analysis_id !== analysisFilter) return false;
      if (answeredFilter === "answered" && !item.answer) return false;
      if (answeredFilter === "empty" && item.answer) return false;
      if (!needle) return true;
      return [item.question, item.context, item.answer]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [analysisFilter, answeredFilter, cvFilter, questions, search]);

  const selected =
    filteredQuestions.find((question) => question.id === selectedId) ??
    filteredQuestions[0] ??
    null;

  const resetDraft = () => {
    setDraft({
      ...emptyDraft,
      cv_id: cvFilter || initialCvId || "",
      analysis_id: analysisFilter || initialAnalysisId || "",
    });
  };

  const refreshAndSelect = async (id?: string) => {
    await onRefresh();
    if (id) setSelectedId(id);
  };

  const createQuestion = async (generateAfter = false) => {
    if (generateAfter && !hasGeminiApiKey) {
      onOpenSettings();
      return;
    }
    if (generateAfter && !draft.context.trim()) {
      setError("Añade contexto para generar la respuesta con IA.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: draft.question,
          context: draft.context || null,
          answer: draft.answer || null,
          cv_id: draft.cv_id || null,
          analysis_id: draft.analysis_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "No se pudo crear la pregunta");
      resetDraft();
      if (generateAfter) {
        const generateRes = await fetch(
          `/api/interview-questions/${data.id}/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              geminiApiKey,
              model,
              context: draft.context,
              cv_id: draft.cv_id || null,
              analysis_id: draft.analysis_id || null,
            }),
          },
        );
        const generated = await generateRes.json();
        if (!generateRes.ok) {
          throw new Error(generated.error || "No se pudo generar la respuesta");
        }
      }
      await refreshAndSelect(data.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateSelected = async (updates: Record<string, unknown>) => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/interview-questions/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "No se pudo guardar la pregunta");
      await refreshAndSelect(data.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveManualDetail = () => {
    if (!selected) return;
    updateSelected({
      question: questionRef.current?.value ?? selected.question,
      context: contextRef.current?.value || null,
      answer: answerRef.current?.value || null,
    });
  };

  const deleteSelected = async () => {
    if (!selected) return;
    if (!confirm("¿Seguro que quieres borrar esta pregunta?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/interview-questions/${selected.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "No se pudo borrar la pregunta");
      await refreshAndSelect();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const runAI = async (mode: "generate" | "edit") => {
    if (!selected) return;
    if (!hasGeminiApiKey) {
      onOpenSettings();
      return;
    }
    setAiLoading(mode);
    setError(null);
    try {
      const res = await fetch(
        `/api/interview-questions/${selected.id}/${mode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            geminiApiKey,
            model,
            context: selected.context,
            instruction: mode === "edit" ? aiInstruction : undefined,
            cv_id: selected.cv_id,
            analysis_id: selected.analysis_id,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo usar la IA");
      setAiInstruction("");
      await refreshAndSelect(data.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setAiLoading(null);
    }
  };

  return (
    <div className="flex-1 overflow-hidden p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid h-full w-full gap-6 xl:grid-cols-[380px_1fr]"
      >
        <section className="flex min-h-0 flex-col">
          <div className="mb-4 space-y-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar preguntas"
                className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#0a0a12] pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={cvFilter}
                onChange={(event) => setCvFilter(event.target.value)}
                className="h-9 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-2 text-xs text-zinc-300 outline-none"
              >
                <option value="">Todos los CVs</option>
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name}
                  </option>
                ))}
              </select>
              <select
                value={analysisFilter}
                onChange={(event) => setAnalysisFilter(event.target.value)}
                className="h-9 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-2 text-xs text-zinc-300 outline-none"
              >
                <option value="">Todas las ofertas</option>
                {jobAnalyses.map((analysis) => (
                  <option key={analysis.id} value={analysis.id}>
                    {analysis.title}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={answeredFilter}
              onChange={(event) =>
                setAnsweredFilter(event.target.value as typeof answeredFilter)
              }
              className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#0a0a12] px-2 text-xs text-zinc-300 outline-none"
            >
              <option value="all">Todas</option>
              <option value="answered">Con respuesta</option>
              <option value="empty">Pendientes</option>
            </select>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
            {filteredQuestions.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-zinc-600">
                <MessageSquareQuote className="mb-3 h-8 w-8" />
                No hay preguntas con estos filtros.
              </div>
            ) : (
              filteredQuestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`mb-1 block w-full rounded-lg border p-3 text-left transition-colors ${
                    selected?.id === item.id
                      ? "border-fuchsia-500/30 bg-fuchsia-500/10"
                      : "border-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  <p className="line-clamp-2 text-sm font-semibold text-zinc-100">
                    {item.question}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.answer ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Respondida
                      </span>
                    ) : (
                      <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        Pendiente
                      </span>
                    )}
                    {item.cv && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                        <FileText className="h-3 w-3" />
                        {item.cv.name}
                      </span>
                    )}
                    {item.analysis && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        <Briefcase className="h-3 w-3" />
                        Oferta
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="border-b border-white/[0.06] p-4">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Plus className="h-3.5 w-3.5 text-fuchsia-300" />
              Nueva pregunta
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              <textarea
                value={draft.question}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    question: event.target.value,
                  }))
                }
                placeholder="Pregunta obligatoria"
                className="min-h-24 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40"
              />
              <textarea
                value={draft.context}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    context: event.target.value,
                  }))
                }
                placeholder="Contexto para la IA"
                className="min-h-24 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40"
              />
              <textarea
                value={draft.answer}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    answer: event.target.value,
                  }))
                }
                placeholder="Respuesta manual opcional"
                className="min-h-24 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40 lg:col-span-2"
              />
              <select
                value={draft.cv_id}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    cv_id: event.target.value,
                  }))
                }
                className="h-10 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 text-sm text-zinc-300 outline-none"
              >
                <option value="">Sin CV asociado</option>
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name}
                  </option>
                ))}
              </select>
              <select
                value={draft.analysis_id}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    analysis_id: event.target.value,
                  }))
                }
                className="h-10 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 text-sm text-zinc-300 outline-none"
              >
                <option value="">Sin oferta asociada</option>
                {jobAnalyses.map((analysis) => (
                  <option key={analysis.id} value={analysis.id}>
                    {analysis.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => createQuestion(false)}
                disabled={saving || !draft.question.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar sin IA
              </button>
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                aria-label="Modelo para generar con IA"
                className="h-10 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 text-sm text-zinc-300 outline-none"
              >
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
              <button
                type="button"
                onClick={() => createQuestion(true)}
                disabled={saving || !draft.question.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-fuchsia-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-fuchsia-500 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Crear y generar con IA
              </button>
            </div>
          </div>

          {error && (
            <div className="m-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          {selected ? (
            <div className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                    Detalle
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-zinc-100">
                    {selected.question}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={deleteSelected}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <textarea
                  ref={questionRef}
                  defaultValue={selected.question}
                  key={`question-${selected.id}-${selected.updated_at}`}
                  onBlur={(event) =>
                    event.target.value.trim() !== selected.question &&
                    updateSelected({ question: event.target.value })
                  }
                  className="min-h-24 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40"
                />
                <textarea
                  ref={contextRef}
                  defaultValue={selected.context ?? ""}
                  key={`context-${selected.id}-${selected.updated_at}`}
                  onBlur={(event) =>
                    event.target.value !== (selected.context ?? "") &&
                    updateSelected({ context: event.target.value || null })
                  }
                  className="min-h-24 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40"
                />
                <textarea
                  ref={answerRef}
                  defaultValue={selected.answer ?? ""}
                  key={`answer-${selected.id}-${selected.updated_at}`}
                  onBlur={(event) =>
                    event.target.value !== (selected.answer ?? "") &&
                    updateSelected({ answer: event.target.value || null })
                  }
                  className="min-h-52 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 py-2 text-sm leading-6 text-zinc-100 outline-none focus:border-fuchsia-500/40 lg:col-span-2"
                />
                <button
                  type="button"
                  onClick={saveManualDetail}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-white disabled:opacity-50 lg:col-span-2 lg:w-fit"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar cambios manuales
                </button>
                <select
                  value={selected.cv_id ?? ""}
                  onChange={(event) =>
                    updateSelected({ cv_id: event.target.value || null })
                  }
                  className="h-10 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 text-sm text-zinc-300 outline-none"
                >
                  <option value="">Sin CV asociado</option>
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selected.analysis_id ?? ""}
                  onChange={(event) =>
                    updateSelected({ analysis_id: event.target.value || null })
                  }
                  className="h-10 rounded-lg border border-white/[0.08] bg-[#0a0a12] px-3 text-sm text-zinc-300 outline-none"
                >
                  <option value="">Sin oferta asociada</option>
                  {jobAnalyses.map((analysis) => (
                    <option key={analysis.id} value={analysis.id}>
                      {analysis.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#0a0a12]/70 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-200">
                    <Sparkles className="h-4 w-4 text-fuchsia-300" />
                    IA
                  </p>
                </div>
                <div className="grid gap-3 lg:grid-cols-[1fr_180px_auto_auto]">
                  <input
                    value={aiInstruction}
                    onChange={(event) => setAiInstruction(event.target.value)}
                    placeholder="Instrucción para editar con IA"
                    className="h-10 rounded-lg border border-white/[0.08] bg-[#09090f] px-3 text-sm text-zinc-100 outline-none focus:border-fuchsia-500/40"
                  />
                  <select
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    aria-label="Modelo para generar con IA"
                    className="h-10 rounded-lg border border-white/[0.08] bg-[#09090f] px-3 text-xs text-zinc-300 outline-none"
                  >
                    <option value="gemini-3.1-pro-preview">
                      Gemini 3.1 Pro
                    </option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => runAI("generate")}
                    disabled={aiLoading !== null}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/20 disabled:opacity-50"
                  >
                    {aiLoading === "generate" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generar con IA
                  </button>
                  <button
                    type="button"
                    onClick={() => runAI("edit")}
                    disabled={
                      aiLoading !== null ||
                      !selected.answer ||
                      !aiInstruction.trim()
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-teal-500/20 bg-teal-500/10 px-4 text-sm font-semibold text-teal-200 hover:bg-teal-500/20 disabled:opacity-50"
                  >
                    {aiLoading === "edit" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                    Editar con IA
                  </button>
                </div>
                {!hasGeminiApiKey && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="mt-3 text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200"
                  >
                    Configurar Gemini API key
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  selected.analysis_id && onOpenAnalysis(selected.analysis_id)
                }
                disabled={!selected.analysis_id}
                className="inline-flex h-9 items-center gap-2 rounded-lg text-sm font-semibold text-zinc-500 hover:text-emerald-300 disabled:hidden"
              >
                <Briefcase className="h-4 w-4" />
                Abrir oferta asociada
              </button>
              {saving && (
                <p className="inline-flex items-center gap-2 text-xs text-zinc-500">
                  <Save className="h-3.5 w-3.5" />
                  Guardando...
                </p>
              )}
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-zinc-600">
              Selecciona o crea una pregunta.
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
}
