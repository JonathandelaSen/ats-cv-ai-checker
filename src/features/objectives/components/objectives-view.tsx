"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Target } from "lucide-react";
import type {
  ObjectiveContextType,
  ObjectiveItem,
  ObjectiveItemStatus,
  ObjectiveOutcome,
  ObjectiveOutcomeStatus,
  ObjectiveOutcomeType,
  ObjectivePriority,
  ObjectiveSource,
  ObjectiveStatus,
  ObjectiveWithRelations,
} from "../api/objectives-api";
import { getErrorMessage } from "@/lib/errors";
import { useObjectivesMutations } from "../hooks/use-objectives-mutations";
import { useObjectivesWorkspace } from "../hooks/use-objectives-queries";
import { useObjectivesRouteState } from "../hooks/use-objectives-route-state";
import { ObjectiveDetail } from "./objective-detail";
import { ObjectiveFormPanel } from "./objective-form-panel";
import { ObjectivesDetailSkeleton } from "./objectives-skeleton";
import { ObjectivesSidebar } from "./objectives-sidebar";
import type {
  ItemEditForm,
  ObjectiveForm,
  OutcomeEditForm,
} from "./objectives-ui";

export default function ObjectivesView() {
  const t = useTranslations("objectives");
  const workspaceQuery = useObjectivesWorkspace();
  const mutations = useObjectivesMutations();
  const routeState = useObjectivesRouteState();
  const {
    clearObjective,
    objectiveId,
    replaceObjective,
    selectObjective,
    setStatus,
    status,
  } = routeState;
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ObjectiveForm | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newOutcomeTitle, setNewOutcomeTitle] = useState("");
  const [newOutcomeType, setNewOutcomeType] =
    useState<ObjectiveOutcomeType>("leadership");
  const [contextDraft, setContextDraft] = useState({
    name: "",
    type: "project" as ObjectiveContextType,
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemEditForm | null>(null);
  const [editingOutcomeId, setEditingOutcomeId] = useState<string | null>(null);
  const [outcomeForm, setOutcomeForm] = useState<OutcomeEditForm | null>(null);

  const contexts = workspaceQuery.data?.contexts ?? [];
  const commitments = workspaceQuery.data?.commitments ?? [];
  const loading = workspaceQuery.isLoading;
  const saving = Object.values(mutations).some((mutation) => mutation.isPending);
  const hasLoadedWorkspace = !loading || commitments.length > 0 || contexts.length > 0;
  const isEmpty = commitments.length === 0;
  const filteredCommitments = useMemo(
    () =>
      commitments.filter((commitment) => {
        if (status === "all") return true;
        const closed = ["achieved", "missed", "cancelled"].includes(commitment.status);
        return status === "closed" ? closed : !closed;
      }),
    [commitments, status]
  );
  const selected =
    commitments.find((item) => item.id === objectiveId) ??
    (objectiveId ? null : filteredCommitments[0] ?? null);
  const selectedIdInCurrentList =
    filteredCommitments.find((item) => item.id === objectiveId)?.id ?? null;
  const selectedContext = selected
    ? contexts.find((context) => context.id === selected.contextId) ?? null
    : null;
  const queryError = workspaceQuery.error
    ? getErrorMessage(workspaceQuery.error)
    : null;
  const visibleError = error ?? queryError;

  useEffect(() => {
    if (!objectiveId && filteredCommitments[0]?.id) {
      replaceObjective(filteredCommitments[0].id);
    }
  }, [filteredCommitments, objectiveId, replaceObjective]);

  const clearInlineEdits = () => {
    setForm(null);
    setEditingItemId(null);
    setEditingOutcomeId(null);
  };

  const startCreate = () => {
    const defaultContext = contexts.find((context) => context.isDefault) ?? contexts[0];
    const today = new Date().toISOString().slice(0, 10);
    setIsCreating(true);
    setForm({
      contextId: defaultContext?.id ?? "",
      title: "",
      description: "",
      successCriteria: "",
      resultNotes: "",
      source: "self",
      status: "active",
      priority: "",
      startDate: today,
      targetDate: "",
    });
  };

  const startEdit = (commitment: ObjectiveWithRelations) => {
    setIsCreating(false);
    setForm({
      contextId: commitment.contextId,
      title: commitment.title,
      description: commitment.description ?? "",
      successCriteria: commitment.successCriteria ?? "",
      resultNotes: commitment.resultNotes ?? "",
      source: commitment.source,
      status: commitment.status,
      priority: commitment.priority ?? "",
      startDate: commitment.startDate,
      targetDate: commitment.targetDate ?? "",
    });
  };

  const saveObjective = async () => {
    if (!form || !form.title.trim() || !form.contextId) {
      setError(t("errors.required"));
      return;
    }
    setError(null);
    const payload = objectivePayload(form);
    const targetId = isCreating ? null : selected?.id;

    if (targetId) {
      setForm(null);
      setIsCreating(false);
      void runMutation(
        () =>
          mutations.updateObjective.mutateAsync({
            id: targetId,
            updates: payload,
          }),
        t("errors.saveObjective")
      );
      return;
    }

    try {
      setForm(null);
      setIsCreating(false);
      const optimisticId = `optimistic-objective-${Date.now()}`;
      selectObjective(optimisticId);
      const data = await mutations.createObjective.mutateAsync({
        input: payload,
        optimisticId,
      });
      selectObjective(data.id);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      clearObjective();
    }
  };

  const createContext = async () => {
    if (!contextDraft.name.trim()) return;
    setError(null);
    try {
      const data = await mutations.createContext.mutateAsync(contextDraft);
      setContextDraft({ name: "", type: "project" });
      setForm((current) => (current ? { ...current, contextId: data.id } : current));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const updateItemStatus = async (item: ObjectiveItem, status: ObjectiveItemStatus) => {
    if (isEmpty) return;
    const completedAt = status === "done" ? new Date().toISOString() : null;
    await runMutation(
      () => mutations.updateItem.mutateAsync({ id: item.id, updates: { status, completedAt } }),
      t("errors.saveChanges")
    );
  };

  const startEditItem = (item: ObjectiveItem) => {
    if (isEmpty) return;
    setEditingItemId(item.id);
    setItemForm({
      title: item.title,
      notes: item.notes ?? "",
      evidenceNotes: item.evidenceNotes ?? "",
      status: item.status,
      dueDate: item.dueDate ?? "",
    });
  };

  const saveItem = async () => {
    if (!editingItemId || !itemForm || !itemForm.title.trim()) return;
    const completedAt = itemForm.status === "done" ? new Date().toISOString() : null;
    const itemId = editingItemId;
    const updates = {
      title: itemForm.title,
      notes: itemForm.notes || null,
      evidenceNotes: itemForm.evidenceNotes || null,
      status: itemForm.status,
      dueDate: itemForm.dueDate || null,
      completedAt,
    };
    stopEditingItem();
    void runMutation(
      () =>
        mutations.updateItem.mutateAsync({
          id: itemId,
          updates,
        }),
      t("errors.saveChanges")
    );
  };

  const startEditOutcome = (outcome: ObjectiveOutcome) => {
    if (isEmpty) return;
    setEditingOutcomeId(outcome.id);
    setOutcomeForm({
      title: outcome.title,
      description: outcome.description ?? "",
      type: outcome.type,
      status: outcome.status,
      amount: outcome.amount?.toString() ?? "",
      currency: outcome.currency ?? "EUR",
    });
  };

  const saveOutcome = async () => {
    if (!editingOutcomeId || !outcomeForm || !outcomeForm.title.trim()) return;
    const decidedAt = outcomeForm.status !== "expected" ? new Date().toISOString() : null;
    await runMutation(
      () =>
        mutations.updateOutcome.mutateAsync({
          id: editingOutcomeId,
          updates: {
            title: outcomeForm.title,
            description: outcomeForm.description || null,
            type: outcomeForm.type,
            status: outcomeForm.status,
            amount: outcomeForm.amount ? Number(outcomeForm.amount) : null,
            currency: outcomeForm.currency || null,
            decidedAt,
          },
        }),
      t("errors.saveChanges")
    );
    stopEditingOutcome();
  };

  const createItem = async () => {
    if (!selected || !newItemTitle.trim() || isEmpty) return;
    const title = newItemTitle;
    const objectiveId = selected.id;
    const orderIndex = selected.items.length;
    setNewItemTitle("");
    void runMutation(
      () =>
        mutations.createItem.mutateAsync({
          objectiveId,
          input: { title, orderIndex },
        }),
      t("errors.saveChanges")
    );
  };

  const createOutcome = async () => {
    if (!selected || !newOutcomeTitle.trim() || isEmpty) return;
    const title = newOutcomeTitle;
    const type = newOutcomeType;
    const objectiveId = selected.id;
    setNewOutcomeTitle("");
    void runMutation(
      () =>
        mutations.createOutcome.mutateAsync({
          objectiveId,
          input: { title, type, status: "expected" },
        }),
      t("errors.saveChanges")
    );
  };

  const updateOutcomeStatus = async (
    outcome: ObjectiveOutcome,
    status: ObjectiveOutcomeStatus
  ) => {
    if (isEmpty) return;
    await runMutation(
      () =>
        mutations.updateOutcome.mutateAsync({
          id: outcome.id,
          updates: {
            status,
            decidedAt: status === "expected" ? null : new Date().toISOString(),
          },
        }),
      t("errors.saveChanges")
    );
  };

  const deleteItem = async (item: ObjectiveItem) => {
    if (isEmpty || !window.confirm("Delete this action item?")) return;
    await runMutation(
      () => mutations.deleteItem.mutateAsync(item.id),
      t("errors.saveChanges")
    );
  };

  const deleteOutcome = async (outcome: ObjectiveOutcome) => {
    if (isEmpty || !window.confirm("Delete this outcome?")) return;
    await runMutation(
      () => mutations.deleteOutcome.mutateAsync(outcome.id),
      t("errors.saveChanges")
    );
  };

  const deleteObjective = async () => {
    if (!selected || isEmpty || !window.confirm("Delete this objective?")) return;
    const deletedId = selected.id;
    const currentIndex = filteredCommitments.findIndex((item) => item.id === deletedId);
    const nextObjective =
      filteredCommitments[currentIndex + 1] ??
      filteredCommitments[currentIndex - 1] ??
      filteredCommitments.find((item) => item.id !== deletedId) ??
      null;

    clearInlineEdits();
    if (nextObjective) {
      replaceObjective(nextObjective.id);
    } else {
      clearObjective();
    }

    setError(null);
    try {
      await mutations.deleteObjective.mutateAsync(deletedId);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t("errors.saveChanges"));
      replaceObjective(deletedId);
    }
  };

  const stopEditingItem = () => {
    setEditingItemId(null);
    setItemForm(null);
  };

  const stopEditingOutcome = () => {
    setEditingOutcomeId(null);
    setOutcomeForm(null);
  };

  const runMutation = async <TResult,>(
    action: () => Promise<TResult>,
    fallbackMessage: string
  ) => {
    setError(null);
    try {
      return await action();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || fallbackMessage);
      return null;
    }
  };

  const statusLabel = (status: ObjectiveStatus) => t(`status.${status}`);
  const itemStatusLabel = (status: ObjectiveItemStatus) => t(`itemStatus.${status}`);
  const outcomeLabel = (type: ObjectiveOutcomeType) => t(`outcomeTypes.${type}`);
  const outcomeStatusLabel = (status: ObjectiveOutcomeStatus) =>
    t(`outcomeStatus.${status}`);
  const priorityLabel = (priority: ObjectivePriority) => t(`priority.${priority}`);
  const sourceLabel = (source: ObjectiveSource) => t(`source.${source}`);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden text-zinc-100">
      <header className="shrink-0 border-b border-white/[0.06] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-50">
            <Target className="h-6 w-6 text-zinc-400" />
            {t("title")}
          </h1>
          <button
            type="button"
            onClick={startCreate}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-950 shadow-[0_0_30px_rgba(110,231,183,0.18)] transition-colors hover:bg-emerald-200 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {t("newObjective")}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ObjectivesSidebar
          contexts={contexts}
          commitments={filteredCommitments}
          filter={status}
          hasLoadedWorkspace={hasLoadedWorkspace}
          selectedId={selectedIdInCurrentList}
          onFilterChange={setStatus}
          onSelect={(id) => {
            selectObjective(id);
            clearInlineEdits();
          }}
          statusLabel={statusLabel}
          t={t}
        />

        <main className="min-w-0 flex-1 overflow-y-auto p-5 lg:p-8">
          {visibleError && (
            <div className="mb-4 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {visibleError}
            </div>
          )}

          {!hasLoadedWorkspace ? (
            <ObjectivesDetailSkeleton />
          ) : form ? (
            <ObjectiveFormPanel
              contexts={contexts}
              contextDraft={contextDraft}
              form={form}
              isCreating={isCreating}
              saving={saving}
              onCancel={() => setForm(null)}
              onContextDraftChange={setContextDraft}
              onCreateContext={createContext}
              onFormChange={setForm}
              onSave={saveObjective}
              priorityLabel={priorityLabel}
              sourceLabel={sourceLabel}
              statusLabel={statusLabel}
              t={t}
            />
          ) : selected ? (
            <ObjectiveDetail
              editingItemId={editingItemId}
              editingOutcomeId={editingOutcomeId}
              isEmpty={isEmpty}
              itemForm={itemForm}
              newItemTitle={newItemTitle}
              newOutcomeTitle={newOutcomeTitle}
              newOutcomeType={newOutcomeType}
              outcomeForm={outcomeForm}
              saving={saving}
              selected={selected}
              selectedContext={selectedContext}
              onCreateItem={createItem}
              onCreateOutcome={createOutcome}
              onDeleteItem={deleteItem}
              onDeleteObjective={deleteObjective}
              onDeleteOutcome={deleteOutcome}
              onEditItem={startEditItem}
              onEditObjective={startEdit}
              onEditOutcome={startEditOutcome}
              onItemFormChange={setItemForm}
              onItemTitleChange={setNewItemTitle}
              onNewOutcomeTitleChange={setNewOutcomeTitle}
              onNewOutcomeTypeChange={setNewOutcomeType}
              onOutcomeFormChange={setOutcomeForm}
              onSaveItem={saveItem}
              onSaveOutcome={saveOutcome}
              onStopEditingItem={stopEditingItem}
              onStopEditingOutcome={stopEditingOutcome}
              onUpdateItemStatus={updateItemStatus}
              onUpdateOutcomeStatus={updateOutcomeStatus}
              itemStatusLabel={itemStatusLabel}
              outcomeLabel={outcomeLabel}
              outcomeStatusLabel={outcomeStatusLabel}
              priorityLabel={priorityLabel}
              sourceLabel={sourceLabel}
              statusLabel={statusLabel}
              t={t}
            />
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-zinc-500">{t("emptySelection")}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function objectivePayload(form: ObjectiveForm) {
  return {
    ...form,
    description: form.description || null,
    successCriteria: form.successCriteria || null,
    resultNotes: form.resultNotes || null,
    priority: form.priority || null,
    targetDate: form.targetDate || null,
  };
}
