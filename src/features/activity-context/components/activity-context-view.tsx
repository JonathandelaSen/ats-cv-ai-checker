"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type {
  ActivityContext,
  ActivityContextType,
} from "../api/activity-context-api";
import { useActivityContextMutations, useActivityContexts } from "../hooks/use-activity-contexts";
import { getErrorMessage } from "@/lib/errors";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-300 focus:ring-0";
const typeLabels: Record<ActivityContextType, string> = {
  employment: "Employment",
  project: "Project",
  personal: "Personal",
  other: "Other",
};

function defaultReturnTo(source: string | null) {
  if (source === "work-journal") return "/work-journal";
  if (source === "objectives") return "/objectives";
  if (source === "received-feedback") return "/received-feedback";
  return "/";
}

function withSelectedContext(returnTo: string, contextId: string) {
  const url = new URL(returnTo, window.location.origin);
  url.searchParams.set("activityContextId", contextId);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function ActivityContextView() {
  const router = useRouter();
  const params = useSearchParams();
  const source = params.get("source");
  const returnTo = params.get("returnTo") ?? defaultReturnTo(source);
  const query = useActivityContexts();
  const mutations = useActivityContextMutations();
  const [draft, setDraft] = useState({ name: "", type: "project" as ActivityContextType });
  const [error, setError] = useState<string | null>(null);
  const contexts = query.data?.contexts ?? [];
  const suggestions = query.data?.suggestions ?? [];
  const saving =
    mutations.create.isPending ||
    mutations.update.isPending ||
    mutations.delete.isPending ||
    mutations.suggestion.isPending;
  const visibleError = error ?? (query.error ? getErrorMessage(query.error) : null);
  const sortedContexts = useMemo(
    () => [...contexts].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name)),
    [contexts]
  );

  const createContext = async () => {
    if (!draft.name.trim()) return;
    setError(null);
    try {
      const context = await mutations.create.mutateAsync(draft);
      router.push(withSelectedContext(returnTo, context.id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const selectContext = (context: ActivityContext) => {
    router.push(withSelectedContext(returnTo, context.id));
  };

  const archiveContext = async (context: ActivityContext) => {
    setError(null);
    try {
      await mutations.update.mutateAsync({
        id: context.id,
        updates: { status: context.status === "active" ? "archived" : "active" },
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const deleteContext = async (context: ActivityContext) => {
    if (context.isDefault) return;
    setError(null);
    try {
      await mutations.delete.mutateAsync(context.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#09090f] text-zinc-100">
      <header className="shrink-0 border-b border-white/[0.06] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => router.push(returnTo)}
              className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="text-lg font-semibold">Activity contexts</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
              An activity context is the work sphere where something happened: a company,
              role, project, client, initiative, or personal area. Use contexts to connect
              journal entries, objectives, feedback, and achievements across the app.
            </p>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-3">
          {visibleError && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {visibleError}
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
              <select
                className={inputClass}
                value={draft.type}
                onChange={(event) =>
                  setDraft({ ...draft, type: event.target.value as ActivityContextType })
                }
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value} className="bg-zinc-900">
                    {label}
                  </option>
                ))}
              </select>
              <input
                className={inputClass}
                placeholder="Company, project, client, initiative..."
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
              <button
                type="button"
                onClick={() => void createContext()}
                disabled={saving || !draft.name.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-60"
              >
                {mutations.create.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create
              </button>
            </div>
          </div>

          {query.isLoading ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-sm text-zinc-400">
              Loading contexts...
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {sortedContexts.map((context) => (
                <article
                  key={context.id}
                  className="rounded-lg border border-white/10 bg-white/[0.025] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-zinc-100">
                          {context.name}
                        </h2>
                        {context.isDefault && (
                          <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-200">
                            Default
                          </span>
                        )}
                        {context.status === "archived" && (
                          <span className="rounded-full border border-zinc-500/20 bg-zinc-500/10 px-2 py-0.5 text-[11px] text-zinc-300">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{typeLabels[context.type]}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {context.status === "active" && (
                        <button
                          type="button"
                          onClick={() => selectContext(context)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-white"
                          title="Select"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void archiveContext(context)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-white/5 hover:text-white"
                        title={context.status === "active" ? "Archive" : "Restore"}
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteContext(context)}
                        disabled={context.isDefault}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-30"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <h2 className="text-sm font-semibold">Suggestions from your CVs</h2>
            </div>
            <div className="space-y-2">
              {suggestions.length === 0 ? (
                <p className="text-sm leading-6 text-zinc-500">
                  No suggestions right now. Companies and projects found in template CVs
                  will appear here for review.
                </p>
              ) : (
                suggestions.map((suggestion) => (
                  <div
                    key={`${suggestion.type}:${suggestion.name}`}
                    className="rounded-lg border border-white/10 bg-black/10 p-3"
                  >
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {suggestion.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {typeLabels[suggestion.type]}
                      {suggestion.roleOrLabel ? ` · ${suggestion.roleOrLabel}` : ""}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void mutations.suggestion.mutateAsync({
                            ...suggestion,
                            action: "promote",
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void mutations.suggestion.mutateAsync({
                            ...suggestion,
                            action: "hide",
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                      >
                        <X className="h-3.5 w-3.5" />
                        Hide
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
