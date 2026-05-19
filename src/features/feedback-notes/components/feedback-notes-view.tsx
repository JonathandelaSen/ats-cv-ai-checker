"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getErrorMessage } from "@/lib/errors";
import { CopyPromptModal } from "@/components/shared/copy-prompt-modal";
import { useFeedbackNotesMutations } from "../hooks/use-feedback-notes-mutations";
import {
  useFeedbackEntries,
  useFeedbackNoteDetail,
  useFeedbackNotesList,
} from "../hooks/use-feedback-notes-queries";
import { useFeedbackNotesRouteState } from "../hooks/use-feedback-notes-route-state";
import { FeedbackNotesDetailSkeleton } from "./feedback-notes-skeleton";
import { FeedbackNotesDetail } from "./feedback-notes-detail";
import { FeedbackNotesSidebar } from "./feedback-notes-sidebar";

interface FeedbackNotesViewProps {
  aiProvider: "gemini" | "mock";
  aiApiKey: string;
  aiModel: string;
  hasAIApiKey: boolean;
  onOpenSettings?: () => void;
}

export default function FeedbackNotesView({
  aiProvider,
  aiApiKey,
  aiModel,
  hasAIApiKey,
  onOpenSettings,
}: FeedbackNotesViewProps) {
  const t = useTranslations("feedbackNotes");
  const routeState = useFeedbackNotesRouteState();
  const {
    clearSelection,
    feedbackId,
    replaceFeedback,
    selectFeedback,
    setStatus,
    status,
  } = routeState;
  const listQuery = useFeedbackNotesList(status);
  const detailQuery = useFeedbackNoteDetail(feedbackId);
  const entriesQuery = useFeedbackEntries(feedbackId);
  const mutations = useFeedbackNotesMutations(status);
  const [error, setError] = useState<string | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copiedPromptContent, setCopiedPromptContent] = useState("");
  const [deletingEntryIds, setDeletingEntryIds] = useState<Set<string>>(new Set());

  const feedbacks = listQuery.data ?? [];
  const listSelectedFeedback =
    feedbacks.find((feedback) => feedback.id === feedbackId) ?? null;
  const selectedFeedback = detailQuery.data ?? listSelectedFeedback;
  const entries = entriesQuery.data ?? [];
  const selectedIdInCurrentList = listSelectedFeedback?.id ?? null;
  const isInitialListLoading = listQuery.isLoading && feedbacks.length === 0;

  const isSaving = useMemo(
    () =>
      mutations.createFeedback.isPending ||
      mutations.updateFeedback.isPending ||
      mutations.deleteFeedback.isPending ||
      mutations.closeFeedback.isPending ||
      mutations.reopenFeedback.isPending ||
      mutations.createEntry.isPending ||
      mutations.updateEntry.isPending,
    [mutations]
  );

  useEffect(() => {
    if (!feedbackId && feedbacks[0]?.id) {
      replaceFeedback(feedbacks[0].id);
    }
  }, [feedbackId, feedbacks, replaceFeedback]);

  useEffect(() => {
    const queryError = listQuery.error ?? detailQuery.error ?? entriesQuery.error;
    if (queryError) setError(getErrorMessage(queryError));
  }, [detailQuery.error, entriesQuery.error, listQuery.error]);

  const runMutation = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-[#09090f] text-zinc-100">
      <FeedbackNotesSidebar
        feedbacks={feedbacks}
        selectedId={selectedIdInCurrentList}
        status={status}
        isLoading={isInitialListLoading}
        isCreating={mutations.createFeedback.isPending}
        onStatusChange={setStatus}
        onSelect={selectFeedback}
        onRefresh={() => void mutations.refresh()}
        onCreate={(personName) =>
          void runMutation(async () => {
            const feedback = await mutations.createFeedback.mutateAsync({ personName });
            replaceFeedback(feedback.id);
          })
        }
      />

      <main className="min-w-0 flex-1 overflow-y-auto">
        {error && (
          <div className="m-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        {isInitialListLoading || (feedbackId && detailQuery.isLoading) ? (
          <FeedbackNotesDetailSkeleton />
        ) : !selectedFeedback ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-600">
            {t("emptySelection")}
          </div>
        ) : (
          <FeedbackNotesDetail
            feedback={selectedFeedback}
            entries={entries}
            deletingEntryIds={deletingEntryIds}
            isSaving={isSaving}
            isGenerating={mutations.generateFinalFeedback.isPending}
            onUpdateFeedback={(updates) =>
              void runMutation(() =>
                mutations.updateFeedback.mutateAsync({
                  feedbackId: selectedFeedback.id,
                  updates,
                })
              )
            }
            onDeleteFeedback={() =>
              void runMutation(async () => {
                if (!confirm(t("confirmDeleteFeedback"))) return;
                await mutations.deleteFeedback.mutateAsync(selectedFeedback.id);
                clearSelection();
              })
            }
            onCloseFeedback={() =>
              void runMutation(() => mutations.closeFeedback.mutateAsync(selectedFeedback.id))
            }
            onReopenFeedback={() =>
              void runMutation(() => mutations.reopenFeedback.mutateAsync(selectedFeedback.id))
            }
            onCreateEntry={(content) =>
              void runMutation(() =>
                mutations.createEntry.mutateAsync({
                  feedbackId: selectedFeedback.id,
                  content,
                })
              )
            }
            onUpdateEntry={(entryId, content) =>
              void runMutation(() => mutations.updateEntry.mutateAsync({ entryId, content }))
            }
            onDeleteEntry={(entryId) =>
              void runMutation(async () => {
                if (!confirm(t("confirmDeleteEntry"))) return;
                setDeletingEntryIds((prev) => new Set(prev).add(entryId));
                try {
                  await mutations.deleteEntry.mutateAsync({
                    entryId,
                    feedbackId: selectedFeedback.id,
                  });
                } finally {
                  setDeletingEntryIds((prev) => {
                    const next = new Set(prev);
                    next.delete(entryId);
                    return next;
                  });
                }
              })
            }
            onGenerate={(model) =>
              void runMutation(async () => {
                if (!hasAIApiKey) {
                  onOpenSettings?.();
                  return;
                }
                if (entries.length === 0) {
                  setError("Add at least one entry before generating feedback.");
                  return;
                }
                if (
                  selectedFeedback.finalFeedback?.trim() &&
                  !confirm("This will replace your current final feedback.")
                ) {
                  return;
                }
                await mutations.generateFinalFeedback.mutateAsync({
                  feedbackId: selectedFeedback.id,
                  provider: aiProvider,
                  apiKey: aiApiKey,
                  model: aiModel,
                });
              })
            }
            onCopyPrompt={(prompt) => {
              setCopiedPromptContent(prompt);
              setIsCopyModalOpen(true);
            }}
          />
        )}
      </main>

      <CopyPromptModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title={t("copyPrompt.title")}
        message={t("copyPrompt.message")}
        promptContent={copiedPromptContent}
      />
    </div>
  );
}
