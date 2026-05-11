"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X, Copy, Check } from "lucide-react";

interface CopyPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  promptContent?: string;
}

export function CopyPromptModal({
  isOpen,
  onClose,
  title = "Prompt copied!",
  message = "You can now paste it into ChatGPT, Claude, or your favorite AI to generate the result.",
  promptContent,
}: CopyPromptModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleCopyAndClose = async () => {
    if (promptContent) {
      await navigator.clipboard.writeText(promptContent);
    }
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      onClose();
    }, 750);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#12121a] p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-md text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-100">{title}</h3>
              <p className="mb-4 text-sm text-zinc-400">{message}</p>
              
              {promptContent && (
                <div className="mb-6 w-full text-left">
                  <div className="max-h-80 overflow-y-auto rounded-lg border border-white/5 bg-black/40 p-4 text-sm font-mono text-zinc-300 whitespace-pre-wrap">
                    {promptContent}
                  </div>
                </div>
              )}
              
              <button
                type="button"
                onClick={handleCopyAndClose}
                disabled={isCopied}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.12] disabled:opacity-80"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {isCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
