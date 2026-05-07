"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileSearch,
  MessageSquareQuote,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import {
  OFFER_STATUSES,
  type AnalysisMode,
  type AIContext,
  type InterviewQuestionSummary,
  type JobKeyData,
  type OfferStatus,
} from "@/lib/db";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ScoreHero from "./score-hero";
import TabResumen from "./tab-resumen";
import TabOferta from "./tab-oferta";
import TabEntrevista from "./tab-entrevista";
import TabSeguimiento from "./tab-seguimiento";

interface AIAnalysisViewProps {
  analysis: {
    ai_score: number;
    ai_feedback: string;
    ai_keywords: string;
    ai_improvements: string;
    ai_model: string;
    ai_analyzed_at: string;
    analysis_mode: AnalysisMode;
    job_description: string | null;
    job_url: string | null;
    offer_status: OfferStatus | null;
    offer_notes: string | null;
    offer_next_action: string | null;
    offer_next_action_at: string | null;
    ai_context: AIContext | null;
    job_key_data: string | null;
    job_keywords: string | null;
    cv_keywords: string | null;
    matching_keywords: string | null;
    missing_keywords: string | null;
    id: string;
    cv_id: string | null;
    cv: {
      id: string;
      name: string;
      filename: string;
      type?: string;
    } | null;
    title: string;
    filename: string;
  };
  geminiApiKey?: string;
  hasGeminiApiKey?: boolean;
  interviewQuestions?: InterviewQuestionSummary[];
  onInterviewQuestionCreated?: () => void;
  onOpenQuestions?: () => void;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: () => void;
}

function safeParseArray(value: string | null): string[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function safeParseJobKeyData(value: string | null): JobKeyData | null {
  try {
    const parsed = JSON.parse(value || "null");
    return parsed && typeof parsed === "object" ? (parsed as JobKeyData) : null;
  } catch {
    return null;
  }
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function AIAnalysisView({
  analysis,
  geminiApiKey = "",
  hasGeminiApiKey = false,
  interviewQuestions = [],
  onInterviewQuestionCreated,
  onOpenQuestions,
  onDelete,
  onUpdate,
}: AIAnalysisViewProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [offerStatus, setOfferStatus] = useState<OfferStatus>(
    analysis.offer_status ?? "interesante"
  );
  const [offerNotes, setOfferNotes] = useState(analysis.offer_notes ?? "");
  const [offerNextAction, setOfferNextAction] = useState(
    analysis.offer_next_action ?? ""
  );
  const [offerNextActionAt, setOfferNextActionAt] = useState(
    toDateTimeLocalValue(analysis.offer_next_action_at)
  );
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState("");
  const [quickQuestionContext, setQuickQuestionContext] = useState("");
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [quickQuestionModel, setQuickQuestionModel] = useState(
    "gemini-3.1-pro-preview"
  );

  const keywords = safeParseArray(analysis.ai_keywords);
  const improvements = safeParseArray(analysis.ai_improvements);
  const jobKeywords = safeParseArray(analysis.job_keywords);
  const cvKeywords = safeParseArray(analysis.cv_keywords);
  const matchingKeywords = safeParseArray(analysis.matching_keywords);
  const missingKeywords = safeParseArray(analysis.missing_keywords);
  const jobKeyData = safeParseJobKeyData(analysis.job_key_data);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExport = () => {
    const cvName = analysis.cv?.name ?? analysis.filename;
    const cvUrl = analysis.cv
      ? `${window.location.origin}/api/cvs/${analysis.cv.id}/${analysis.cv.type === "template" ? "template-pdf" : "pdf"}`
      : null;
    const report = `
INFORME DE ANÁLISIS ATS
-----------------------
Archivo: ${analysis.filename}
Nombre: ${analysis.title}
CV utilizado: ${cvName}
${cvUrl ? `Link CV: ${cvUrl}` : ""}
ID de Análisis: ${analysis.id}
Fecha: ${formatDate(analysis.ai_analyzed_at)}
Modelo: ${analysis.ai_model}

PUNTUACIÓN: ${analysis.ai_score}/100

FEEDBACK:
${analysis.ai_feedback}

PALABRAS CLAVE DETECTADAS:
${keywords.join(", ") || "Ninguna"}

KEYWORDS OFERTA:
${jobKeywords.join(", ") || "Ninguna"}

KEYWORDS CV:
${cvKeywords.join(", ") || "Ninguna"}

KEYWORDS FALTANTES:
${missingKeywords.join(", ") || "Ninguna"}

ÁREAS DE MEJORA:
${improvements.map((imp) => `- ${imp}`).join("\n") || "Sin sugerencias"}

${analysis.job_description ? `OFERTA DE TRABAJO:\n${analysis.job_description}` : ""}
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ATS_Report_${analysis.ai_analyzed_at.replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (
      !confirm(
        "¿Seguro que quieres borrar este análisis? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(analysis.id);
    } catch (error) {
      console.error("Error deleting analysis:", error);
      alert("No se pudo borrar el análisis.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveUrl = async (url: string) => {
    setIsSavingUrl(true);
    try {
      const res = await fetch(`/api/analyses/${analysis.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_url: url || null }),
      });
      if (!res.ok) throw new Error("Error al guardar la URL");
      onUpdate?.();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la URL.");
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleSaveTracking = async () => {
    setIsSavingTracking(true);
    try {
      const res = await fetch(`/api/analyses/${analysis.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_status: offerStatus,
          offer_notes: offerNotes,
          offer_next_action: offerNextAction,
          offer_next_action_at: offerNextActionAt || null,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar el seguimiento");
      onUpdate?.();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el seguimiento de la oferta.");
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleCreateInterviewQuestion = async (generateAfter = false) => {
    if (!quickQuestion.trim()) return;
    if (generateAfter && !hasGeminiApiKey) {
      alert("Configura tu API key de Gemini antes de generar respuestas.");
      return;
    }
    if (generateAfter && !quickQuestionContext.trim()) {
      alert("Añade contexto para generar la respuesta con IA.");
      return;
    }
    setIsCreatingQuestion(true);
    try {
      const res = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: quickQuestion.trim(),
          context: quickQuestionContext.trim() || null,
          cv_id: analysis.cv_id ?? null,
          analysis_id: analysis.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo crear la pregunta");
      }
      const created = await res.json();
      if (generateAfter) {
        const generateRes = await fetch(
          `/api/interview-questions/${created.id}/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              geminiApiKey,
              model: quickQuestionModel,
              context: quickQuestionContext,
              cv_id: analysis.cv_id,
              analysis_id: analysis.id,
            }),
          }
        );
        if (!generateRes.ok) {
          const data = await generateRes.json().catch(() => ({}));
          throw new Error(data.error || "No se pudo generar la respuesta");
        }
      }
      setQuickQuestion("");
      setQuickQuestionContext("");
      onInterviewQuestionCreated?.();
      onOpenQuestions?.();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo crear la pregunta asociada."
      );
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  const isJobMatch = analysis.analysis_mode === "job_match";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 overflow-y-auto p-6"
    >
      <div className="flex flex-1 min-h-0">
        <div className="w-full space-y-5">
          {/* Score Hero */}
          <ScoreHero
            score={analysis.ai_score}
            title={analysis.title}
            feedback={analysis.ai_feedback}
            model={analysis.ai_model}
            analyzedAt={analysis.ai_analyzed_at}
            analysisMode={analysis.analysis_mode}
            jobDescription={analysis.job_description}
            jobUrl={analysis.job_url}
            cv={analysis.cv}
            cvId={analysis.cv_id}
            filename={analysis.filename}
            onExport={handleExport}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            onSaveUrl={handleSaveUrl}
            isSavingUrl={isSavingUrl}
          />

          {/* Tabs */}
          <Tabs defaultValue="resumen" className="w-full">
            <div className="sticky top-[-24px] z-20 -mx-6 px-6 py-4 backdrop-blur-md mb-8">
              <TabsList className="bg-white/[0.03] border-white/[0.05] p-1 rounded-2xl gap-1">
                <TabsTrigger
                  value="resumen"
                  className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  <Sparkles className="size-4" />
                  Resumen
                </TabsTrigger>
                {isJobMatch && (
                  <>
                    <TabsTrigger
                      value="oferta"
                      className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                      <Briefcase className="size-4" />
                      Oferta
                    </TabsTrigger>
                    <TabsTrigger
                      value="entrevista"
                      className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                      <MessageSquareQuote className="size-4" />
                      Preguntas
                      {interviewQuestions.length > 0 && (
                        <span className="ml-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5">
                          {interviewQuestions.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="seguimiento"
                      className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                      <CalendarClock className="size-4" />
                      Seguimiento
                    </TabsTrigger>
                  </>
                )}
                {!isJobMatch &&
                  analysis.ai_context?.additionalContext && (
                    <TabsTrigger
                      value="contexto"
                      className="px-5 py-2 gap-2 text-sm font-semibold transition-all data-active:bg-white/10 data-active:text-white data-active:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    >
                      <FileSearch className="size-4" />
                      Contexto
                    </TabsTrigger>
                  )}
              </TabsList>
            </div>

            <div className="min-h-0">
              <TabsContent value="resumen">
                <TabResumen
                  improvements={improvements}
                  keywords={keywords}
                  jobKeywords={jobKeywords}
                  cvKeywords={cvKeywords}
                  matchingKeywords={matchingKeywords}
                  missingKeywords={missingKeywords}
                  analysisMode={analysis.analysis_mode}
                />
              </TabsContent>

              {isJobMatch && (
                <>
                  <TabsContent value="oferta">
                    <TabOferta
                      jobKeyData={jobKeyData}
                      jobDescription={analysis.job_description}
                    />
                  </TabsContent>

                  <TabsContent value="entrevista">
                    <TabEntrevista
                      interviewQuestions={interviewQuestions}
                      onOpenQuestions={onOpenQuestions}
                      quickQuestion={quickQuestion}
                      onQuickQuestionChange={setQuickQuestion}
                      quickQuestionContext={quickQuestionContext}
                      onQuickQuestionContextChange={setQuickQuestionContext}
                      quickQuestionModel={quickQuestionModel}
                      onQuickQuestionModelChange={setQuickQuestionModel}
                      isCreatingQuestion={isCreatingQuestion}
                      onCreateQuestion={handleCreateInterviewQuestion}
                    />
                  </TabsContent>

                  <TabsContent value="seguimiento">
                    <TabSeguimiento
                      offerStatus={offerStatus}
                      onOfferStatusChange={setOfferStatus}
                      offerNotes={offerNotes}
                      onOfferNotesChange={setOfferNotes}
                      offerNextAction={offerNextAction}
                      onOfferNextActionChange={setOfferNextAction}
                      offerNextActionAt={offerNextActionAt}
                      onOfferNextActionAtChange={setOfferNextActionAt}
                      isSavingTracking={isSavingTracking}
                      onSaveTracking={handleSaveTracking}
                    />
                  </TabsContent>
                </>
              )}

              {!isJobMatch &&
                analysis.ai_context?.additionalContext && (
                  <TabsContent value="contexto">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-2xl border border-violet-500/10 bg-violet-500/[0.03] p-6"
                    >
                      <h4 className="text-sm font-semibold text-violet-300 flex items-center gap-2 mb-3">
                        <FileSearch className="w-4 h-4" />
                        Contexto del Análisis
                      </h4>
                      <p className="text-xs text-zinc-400 italic bg-[#0a0a12] rounded-lg p-3 border border-white/[0.04]">
                        {analysis.ai_context.additionalContext}
                      </p>
                    </motion.div>
                  </TabsContent>
                )}
            </div>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}
