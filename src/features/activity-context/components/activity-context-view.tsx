"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useActivityContexts,
  useCreateActivityContext,
  useUpdateActivityContext,
  useDeleteActivityContext,
  useHandleActivityContextSuggestion,
} from "../hooks/use-activity-contexts";
import type { ActivityContext, ActivityContextSuggestion } from "../api/activity-context-api";
import { CreateContextForm } from "./create-context-form";
import { ContextRow } from "./context-row";
import { SuggestionRow } from "./suggestion-row";

type SourceKey = "workJournal" | "objectives" | "receivedFeedback" | "generic";

function resolveSourceKey(source: string | null): SourceKey {
  switch (source) {
    case "work-journal":
      return "workJournal";
    case "objectives":
      return "objectives";
    case "received-feedback":
      return "receivedFeedback";
    default:
      return "generic";
  }
}

function buildReturnUrl(returnTo: string, contextId: string): string {
  const url = new URL(returnTo, window.location.origin);
  url.searchParams.set("activityContextId", contextId);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function ActivityContextView() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const source = params.get("source");
  const returnTo = params.get("returnTo");
  const hasReturnTo = returnTo !== null;

  const t = useTranslations("activityContexts");
  const query = useActivityContexts();
  const createCtx = useCreateActivityContext();
  const updateCtx = useUpdateActivityContext();
  const deleteCtx = useDeleteActivityContext();
  const suggestionCtx = useHandleActivityContextSuggestion();

  const [lastCreated, setLastCreated] = useState<{ id: string; name: string } | null>(null);

  const contexts = query.data?.contexts ?? [];
  const suggestions = query.data?.suggestions ?? [];

  const visibleError =
    createCtx.error ?? updateCtx.error ?? deleteCtx.error ?? suggestionCtx.error ?? null;

  const sortedContexts = useMemo(
    () =>
      [...contexts].sort(
        (a, b) =>
          Number(b.isDefault) - Number(a.isDefault) ||
          (a.status === b.status ? 0 : a.status === "active" ? -1 : 1) ||
          a.name.localeCompare(b.name)
      ),
    [contexts]
  );

  const navigateBackWithContext = useCallback(
    async (contextId: string) => {
      if (!returnTo) return;
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            (key[0] === "work-journal" && key[1] === "contexts") ||
            (key[0] === "received-feedback" && key[1] === "contexts") ||
            (key[0] === "objectives" && key[1] === "workspace")
          );
        },
      });
      router.push(buildReturnUrl(returnTo, contextId));
    },
    [queryClient, returnTo, router]
  );

  const handleCreate = useCallback(
    async (input: { name: string; type: string }) => {
      setLastCreated(null);
      const created = await createCtx.create(input as Parameters<typeof createCtx.create>[0]);
      if (created && hasReturnTo) {
        await navigateBackWithContext(created.id);
        return;
      }
      if (created) {
        setLastCreated({ id: created.id, name: created.name });
      }
    },
    [createCtx, hasReturnTo, navigateBackWithContext]
  );

  const handleSelect = useCallback(
    async (context: ActivityContext) => {
      await navigateBackWithContext(context.id);
    },
    [navigateBackWithContext]
  );

  const handlePromote = useCallback(
    async (suggestion: ActivityContextSuggestion) => {
      setLastCreated(null);
      const result = await suggestionCtx.promote(suggestion);
      if (result && "id" in result && hasReturnTo) {
        await navigateBackWithContext((result as { id: string }).id);
        return;
      }
      if (result && "id" in result) {
        setLastCreated({ id: (result as { id: string; name: string }).id, name: suggestion.name });
      }
    },
    [suggestionCtx, hasReturnTo, navigateBackWithContext]
  );

  const handleHide = useCallback(
    async (suggestion: ActivityContextSuggestion) => {
      await suggestionCtx.hide(suggestion);
    },
    [suggestionCtx]
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#09090f] text-zinc-100">
      <header className="shrink-0 border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {hasReturnTo && (
              <button
                type="button"
                onClick={() => router.push(returnTo)}
                className="mb-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-200"
              >
                <ArrowLeft className="h-3 w-3" />
                {t("back")}
              </button>
            )}
            <h1 className="text-lg font-semibold leading-tight">{t("title")}</h1>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              {t(`description.${resolveSourceKey(source)}`)}
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-4">
            {visibleError && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-4 py-2.5 text-sm text-rose-200">
                {visibleError}
              </div>
            )}

            {lastCreated && hasReturnTo && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <p className="flex-1 text-sm text-zinc-200">
                  {t("created", { name: lastCreated.name })}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(buildReturnUrl(returnTo, lastCreated.id))}
                  className="shrink-0 gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("selectAndReturn")}
                </Button>
              </div>
            )}

            <CreateContextForm
              isPending={createCtx.isPending}
              hasReturnTo={hasReturnTo}
              onCreate={handleCreate}
            />

            {query.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
              </div>
            ) : sortedContexts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/[0.08] px-6 py-10 text-center">
                <p className="text-sm text-zinc-600">{t("empty")}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedContexts.map((context) => (
                  <ContextRow
                    key={context.id}
                    context={context}
                    hasReturnTo={hasReturnTo}
                    onSelect={handleSelect}
                    onUpdate={updateCtx.update}
                    onDelete={deleteCtx.remove}
                    isUpdating={updateCtx.isPending}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              {t("suggestionsTitle")}
            </div>
            {suggestions.length === 0 ? (
              <p className="text-xs leading-5 text-zinc-600">
                {t("suggestionsEmpty")}
              </p>
            ) : (
              <div className="space-y-1">
                {suggestions.map((suggestion) => (
                  <SuggestionRow
                    key={`${suggestion.type}:${suggestion.name}`}
                    suggestion={suggestion}
                    isPending={suggestionCtx.isPending}
                    hasReturnTo={hasReturnTo}
                    onPromote={handlePromote}
                    onHide={handleHide}
                  />
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
