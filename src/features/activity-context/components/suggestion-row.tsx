"use client";

import { useTranslations } from "next-intl";
import { Check, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityContextSuggestion } from "../api/activity-context-api";

interface SuggestionRowProps {
  suggestion: ActivityContextSuggestion;
  isPending: boolean;
  hasReturnTo: boolean;
  onPromote: (suggestion: ActivityContextSuggestion) => void;
  onHide: (suggestion: ActivityContextSuggestion) => void;
}

export function SuggestionRow({
  suggestion,
  isPending,
  hasReturnTo,
  onPromote,
  onHide,
}: SuggestionRowProps) {
  const t = useTranslations("activityContexts");

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-dashed border-white/[0.06] bg-white/[0.01] px-4 py-3 transition-colors hover:border-amber-500/20 hover:bg-white/[0.02]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-400">
        <Sparkles className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <span className="truncate text-sm text-zinc-300">
          {suggestion.name}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onPromote(suggestion)}
          disabled={isPending}
          className="gap-1.5 text-emerald-400 hover:text-emerald-300"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {hasReturnTo ? t("selectAndReturn") : t("create")}
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => onHide(suggestion)}
          disabled={isPending}
          className="text-zinc-600 hover:text-zinc-400"
          title={t("hide")}
        >
          <EyeOff className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
