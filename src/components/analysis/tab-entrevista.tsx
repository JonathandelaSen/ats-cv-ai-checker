"use client";

import { motion } from "framer-motion";
import {
  MessageSquareQuote,
  ExternalLink,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";
import type { InterviewQuestionSummary } from "@/lib/db";

interface TabEntrevistaProps {
  interviewQuestions: InterviewQuestionSummary[];
  onOpenQuestions?: () => void;
  quickQuestion: string;
  onQuickQuestionChange: (value: string) => void;
  quickQuestionContext: string;
  onQuickQuestionContextChange: (value: string) => void;
  quickQuestionModel: string;
  onQuickQuestionModelChange: (value: string) => void;
  isCreatingQuestion: boolean;
  onCreateQuestion: (generateAfter: boolean) => void;
}

export default function TabEntrevista({
  interviewQuestions,
  onOpenQuestions,
  quickQuestion,
  onQuickQuestionChange,
  quickQuestionContext,
  onQuickQuestionContextChange,
  quickQuestionModel,
  onQuickQuestionModelChange,
  isCreatingQuestion,
  onCreateQuestion,
}: TabEntrevistaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6"
    >
      <section className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/[0.025] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300">
              <MessageSquareQuote className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-fuchsia-300">
                Preguntas asociadas
              </h4>
              <p className="text-xs text-zinc-500">
                {interviewQuestions.length} vinculadas a esta oferta.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenQuestions}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 text-xs font-semibold text-fuchsia-300 transition-colors hover:bg-fuchsia-500/20"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir gestor
          </button>
        </div>

        {interviewQuestions.length > 0 ? (
          <div className="mb-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {interviewQuestions.map((question) => (
              <button
                key={question.id}
                type="button"
                onClick={onOpenQuestions}
                className="group rounded-xl border border-white/[0.06] bg-[#0a0a12]/85 p-3 text-left transition-colors hover:border-fuchsia-500/25 hover:bg-fuchsia-500/10"
              >
                <span className="block text-sm font-semibold leading-5 text-zinc-100">
                  {question.question}
                </span>
                {question.answer ? (
                  <span className="mt-2 line-clamp-3 block text-xs leading-5 text-zinc-500 group-hover:text-zinc-400">
                    {question.answer}
                  </span>
                ) : (
                  <span className="mt-2 inline-flex rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    Pendiente de respuesta
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="mb-5 rounded-xl border border-white/[0.04] bg-[#0a0a12]/70 px-4 py-4 text-sm text-zinc-600">
            Todavía no hay preguntas asociadas a esta oferta.
          </p>
        )}

        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a12]/70 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Crear nueva pregunta vinculada
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            <textarea
              value={quickQuestion}
              onChange={(event) => onQuickQuestionChange(event.target.value)}
              placeholder="Pregunta de entrevista"
              rows={2}
              className="resize-none rounded-lg border border-white/[0.06] bg-[#09090f] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-500/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/40"
            />
            <textarea
              value={quickQuestionContext}
              onChange={(event) =>
                onQuickQuestionContextChange(event.target.value)
              }
              placeholder="Contexto opcional para la IA"
              rows={2}
              className="resize-none rounded-lg border border-white/[0.06] bg-[#09090f] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-500/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/40"
            />
            <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
              <button
                type="button"
                onClick={() => onCreateQuestion(false)}
                disabled={isCreatingQuestion || !quickQuestion.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 text-xs font-semibold text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
              >
                {isCreatingQuestion ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Guardar sin IA
              </button>
              <select
                value={quickQuestionModel}
                onChange={(event) =>
                  onQuickQuestionModelChange(event.target.value)
                }
                aria-label="Modelo para generar con IA"
                className="h-10 rounded-lg border border-white/[0.08] bg-[#09090f] px-3 text-xs text-zinc-300 outline-none"
              >
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
              <button
                type="button"
                onClick={() => onCreateQuestion(true)}
                disabled={isCreatingQuestion || !quickQuestion.trim()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 text-xs font-semibold text-fuchsia-300 transition-colors hover:bg-fuchsia-500/20 disabled:opacity-50"
              >
                {isCreatingQuestion ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Crear y generar con IA
              </button>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
