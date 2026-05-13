"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import type {
  AnalysisChatConversation,
  AnalysisChatMessage,
} from "@/modules/analysis-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TabChatOfertaProps {
  analysisId: string;
  geminiApiKey: string;
  hasGeminiApiKey: boolean;
}

function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-100">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-zinc-300">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="text-zinc-300">{children}</li>,
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-emerald-300">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-emerald-300">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-3 last:mb-0">{children}</pre>
        ),
        h1: ({ children }) => (
          <h1 className="mb-2 text-base font-bold text-zinc-100">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 text-sm font-bold text-zinc-100">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1.5 text-sm font-semibold text-zinc-200">
            {children}
          </h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-2 border-cyan-500/30 pl-3 italic text-zinc-400 last:mb-0">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-white/10" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: {
  conversations: AnalysisChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEditing = (conv: AnalysisChatConversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const commitRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-white/[0.06]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Conversaciones
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-zinc-400 hover:text-cyan-300"
          onClick={onNew}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {conversations.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-zinc-600">
              Sin conversaciones
            </p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors cursor-pointer ${
                activeId === conv.id
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-300"
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <MessageCircle className="size-3.5 shrink-0" />
              {editingId === conv.id ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="min-w-0 flex-1 truncate bg-transparent text-xs outline-none"
                />
              ) : (
                <span className="min-w-0 flex-1 truncate text-xs">
                  {conv.title}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10"
                >
                  <MoreHorizontal className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => startEditing(conv)}>
                    <Pencil className="mr-2 size-3.5" />
                    Renombrar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-400"
                    onClick={() => onDelete(conv.id)}
                  >
                    <Trash2 className="mr-2 size-3.5" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function TabChatOferta({
  analysisId,
  geminiApiKey,
  hasGeminiApiKey,
}: TabChatOfertaProps) {
  const [conversations, setConversations] = useState<
    AnalysisChatConversation[]
  >([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<AnalysisChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState("gemini-3.1-pro-preview");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/chat`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error cargando conversaciones.");
      const convs = (data.conversations ?? []) as AnalysisChatConversation[];
      setConversations(convs);
      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando conversaciones.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [analysisId, activeConversationId]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      setIsLoadingMessages(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/analyses/${analysisId}/chat?conversationId=${conversationId}`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Error cargando mensajes.");
        setMessages(data.messages ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando mensajes.");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [analysisId]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadConversations();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadConversations]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (activeConversationId) {
        void loadMessages(activeConversationId);
      } else {
        setMessages([]);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  const createConversation = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/analyses/${analysisId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_conversation" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error creando conversación.");
      const conv = data.conversation as AnalysisChatConversation;
      setConversations((prev) => [conv, ...prev]);
      setActiveConversationId(conv.id);
      setMessages([]);
      textareaRef.current?.focus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error creando conversación."
      );
    }
  };

  const renameConversation = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/analyses/${analysisId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rename_conversation",
          conversationId: id,
          title,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      const updated = data.conversation as AnalysisChatConversation;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
    } catch {
      // silently fail rename
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await fetch(`/api/analyses/${analysisId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_conversation",
          conversationId: id,
        }),
      });
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (activeConversationId === id) {
          setActiveConversationId(next[0]?.id ?? null);
        }
        return next;
      });
    } catch {
      // silently fail delete
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;
    if (!hasGeminiApiKey) {
      setError("Configura tu API key de Gemini antes de chatear con la IA.");
      return;
    }

    let conversationId = activeConversationId;

    if (!conversationId) {
      try {
        const res = await fetch(`/api/analyses/${analysisId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_conversation" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data.error || "Error creando conversación.");
        const conv = data.conversation as AnalysisChatConversation;
        setConversations((prev) => [conv, ...prev]);
        setActiveConversationId(conv.id);
        conversationId = conv.id;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error creando conversación."
        );
        return;
      }
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
          conversationId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.error || "No se pudo enviar el mensaje.");
      setMessages((current) => [
        ...current,
        data.userMessage,
        data.assistantMessage,
      ]);
      setDraft("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar el mensaje."
      );
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex h-[calc(100dvh-280px)] min-h-[400px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a12]"
    >
      {/* Sidebar */}
      <ConversationList
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onNew={createConversation}
        onRename={renameConversation}
        onDelete={deleteConversation}
      />

      {/* Chat area */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-400">
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-zinc-200">
                Chat sobre la oferta
              </h4>
              <p className="text-[11px] text-zinc-600">
                Conectado a tu CV, la oferta y el análisis
              </p>
            </div>
          </div>
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            aria-label="Modelo para el chat"
            className="h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-[11px] text-zinc-400 outline-none transition-colors hover:border-white/[0.12] focus:border-cyan-500/30"
          >
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          </select>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="flex flex-col gap-1 p-4">
            {isLoadingConversations || isLoadingMessages ? (
              <div className="flex flex-1 items-center justify-center py-20 text-sm text-zinc-600">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Cargando...
              </div>
            ) : !activeConversationId ? (
              <EmptyState onNew={createConversation} />
            ) : messages.length === 0 ? (
              <EmptyChat />
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChatBubble message={msg} formatTime={formatTime} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {isSending && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 py-2"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                  <Bot className="size-3.5" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-500">
                  <Loader2 className="size-3.5 animate-spin" />
                  Pensando...
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4"
            >
              <p className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="border-t border-white/[0.06] p-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit(e);
                }
              }}
              placeholder="Pregunta sobre esta oferta..."
              rows={1}
              className="min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-cyan-500/20"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSending || !draft.trim()}
              className="size-10 shrink-0 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-30"
            >
              {isSending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

function ChatBubble({
  message,
  formatTime,
}: {
  message: AnalysisChatMessage;
  formatTime: (d: string) => string;
}) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex gap-3 py-2 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
          isAssistant
            ? "bg-cyan-500/10 text-cyan-400"
            : "bg-white/10 text-zinc-400"
        }`}
      >
        {isAssistant ? (
          <Bot className="size-3.5" />
        ) : (
          <UserRound className="size-3.5" />
        )}
      </div>
      <div
        className={`max-w-[80%] min-w-0 ${
          isAssistant ? "" : "flex flex-col items-end"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAssistant
              ? "rounded-tl-md bg-white/[0.03] text-zinc-300"
              : "rounded-tr-md bg-cyan-500/10 text-zinc-200"
          }`}
        >
          {isAssistant ? (
            <ChatMarkdown content={message.content} />
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
        </div>
        <span className="mt-1 px-1 text-[10px] text-zinc-700">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
        <MessageCircle className="size-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-300">
          Empieza una conversación
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Pregunta sobre la oferta, skills, posicionamiento o estrategia.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onNew}
        className="mt-1 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
      >
        <Plus className="mr-1.5 size-3.5" />
        Nueva conversación
      </Button>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-600">
        <Sparkles className="size-5" />
      </div>
      <div>
        <p className="text-sm text-zinc-400">
          Haz tu primera pregunta
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          La IA tiene contexto completo de tu CV, la oferta y el análisis.
        </p>
      </div>
    </div>
  );
}
