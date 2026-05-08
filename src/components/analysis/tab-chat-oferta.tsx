"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Loader2, Send, UserRound } from "lucide-react";
import type { AnalysisChatMessage } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TabChatOfertaProps {
  analysisId: string;
  geminiApiKey: string;
  hasGeminiApiKey: boolean;
}

export default function TabChatOferta({
  analysisId,
  geminiApiKey,
  hasGeminiApiKey,
}: TabChatOfertaProps) {
  const [messages, setMessages] = useState<AnalysisChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState("gemini-3.1-pro-preview");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analyses/${analysisId}/chat`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudo cargar el chat.");
        if (!ignore) setMessages(data.messages ?? []);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el chat.");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadMessages();
    return () => {
      ignore = true;
    };
  }, [analysisId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;
    if (!hasGeminiApiKey) {
      setError("Configura tu API key de Gemini antes de chatear con la IA.");
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          model,
          geminiApiKey,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el mensaje.");
      setMessages((current) => [
        ...current,
        data.userMessage,
        data.assistantMessage,
      ]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex min-h-[520px] flex-col gap-4 rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.025] p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            <Bot className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-cyan-300">
              Chat sobre la oferta
            </h4>
            <p className="text-xs text-zinc-500">
              Contexto conectado al CV, la oferta y el análisis.
            </p>
          </div>
        </div>
        <select
          value={model}
          onChange={(event) => setModel(event.target.value)}
          aria-label="Modelo para el chat"
          className="h-10 rounded-lg border border-white/[0.08] bg-[#09090f] px-3 text-xs text-zinc-300 outline-none"
        >
          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
        </select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#0a0a12]/70 p-4">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Cargando chat...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-center text-sm text-zinc-500">
            Haz una pregunta concreta sobre la oferta, una skill faltante o cómo
            posicionarte mejor.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "assistant" ? "pr-8" : "justify-end pl-8"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
                  <Bot className="size-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] whitespace-pre-wrap rounded-xl border px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "border-cyan-500/10 bg-cyan-500/[0.04] text-zinc-200"
                    : "border-white/[0.08] bg-white/[0.08] text-zinc-100"
                }`}
              >
                {message.content}
              </div>
              {message.role === "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-zinc-300">
                  <UserRound className="size-4" />
                </div>
              )}
            </div>
          ))
        )}
        {isSending && (
          <div className="flex gap-3 pr-8">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
              <Loader2 className="size-4 animate-spin" />
            </div>
            <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.04] px-4 py-3 text-sm text-zinc-500">
              Pensando...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Pregunta sobre esta oferta"
          rows={3}
          className="resize-none border-white/[0.08] bg-[#09090f] text-sm text-zinc-200 placeholder:text-zinc-600"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSending || !draft.trim()}
            className="bg-cyan-300 text-cyan-950 hover:bg-cyan-200"
          >
            {isSending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Send data-icon="inline-start" />
            )}
            Enviar
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
