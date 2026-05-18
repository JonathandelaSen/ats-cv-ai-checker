import { Calendar, Trash2 } from "lucide-react";
import type {
  ObjectiveContext,
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
import {
  formatDate,
  statusClass,
  type ItemEditForm,
  type OutcomeEditForm,
} from "./objectives-ui";
import { ObjectiveItems } from "./objective-items-section";
import { ObjectiveOutcomes } from "./objective-outcomes-section";

interface ObjectiveDetailProps {
  editingItemId: string | null;
  editingOutcomeId: string | null;
  isEmpty: boolean;
  itemForm: ItemEditForm | null;
  newItemTitle: string;
  newOutcomeTitle: string;
  newOutcomeType: ObjectiveOutcomeType;
  outcomeForm: OutcomeEditForm | null;
  saving: boolean;
  selected: ObjectiveWithRelations;
  selectedContext: ObjectiveContext | null;
  onCreateItem: () => void;
  onCreateOutcome: () => void;
  onDeleteItem: (item: ObjectiveItem) => void;
  onDeleteObjective: () => void;
  onDeleteOutcome: (outcome: ObjectiveOutcome) => void;
  onEditItem: (item: ObjectiveItem) => void;
  onEditObjective: (objective: ObjectiveWithRelations) => void;
  onEditOutcome: (outcome: ObjectiveOutcome) => void;
  onItemFormChange: (form: ItemEditForm) => void;
  onItemTitleChange: (title: string) => void;
  onNewOutcomeTitleChange: (title: string) => void;
  onNewOutcomeTypeChange: (type: ObjectiveOutcomeType) => void;
  onOutcomeFormChange: (form: OutcomeEditForm) => void;
  onSaveItem: () => void;
  onSaveOutcome: () => void;
  onUpdateItemStatus: (item: ObjectiveItem, status: ObjectiveItemStatus) => void;
  onUpdateOutcomeStatus: (
    outcome: ObjectiveOutcome,
    status: ObjectiveOutcomeStatus
  ) => void;
  onStopEditingItem: () => void;
  onStopEditingOutcome: () => void;
  itemStatusLabel: (status: ObjectiveItemStatus) => string;
  outcomeLabel: (type: ObjectiveOutcomeType) => string;
  outcomeStatusLabel: (status: ObjectiveOutcomeStatus) => string;
  priorityLabel: (priority: ObjectivePriority) => string;
  sourceLabel: (source: ObjectiveSource) => string;
  statusLabel: (status: ObjectiveStatus) => string;
  t: (key: string, values?: Record<string, number | string>) => string;
}

export function ObjectiveDetail({
  editingItemId,
  editingOutcomeId,
  isEmpty,
  itemForm,
  newItemTitle,
  newOutcomeTitle,
  newOutcomeType,
  outcomeForm,
  saving,
  selected,
  selectedContext,
  onCreateItem,
  onCreateOutcome,
  onDeleteItem,
  onDeleteObjective,
  onDeleteOutcome,
  onEditItem,
  onEditObjective,
  onEditOutcome,
  onItemFormChange,
  onItemTitleChange,
  onNewOutcomeTitleChange,
  onNewOutcomeTypeChange,
  onOutcomeFormChange,
  onSaveItem,
  onSaveOutcome,
  onUpdateItemStatus,
  onUpdateOutcomeStatus,
  onStopEditingItem,
  onStopEditingOutcome,
  itemStatusLabel,
  outcomeLabel,
  outcomeStatusLabel,
  priorityLabel,
  sourceLabel,
  statusLabel,
  t,
}: ObjectiveDetailProps) {
  const doneCount = selected.items.filter((item) => item.status === "done").length;
  const totalItems = selected.items.length;
  const completion =
    totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100);

  return (
    <section className="w-full">
      <div className="rounded-xl border border-emerald-200/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(255,255,255,0.025)_42%,rgba(245,158,11,0.06))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={statusClass(selected.status)}>
                {statusLabel(selected.status)}
              </span>
              {selected.priority && (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-amber-200">
                  {t("priorityBadge", { priority: priorityLabel(selected.priority) })}
                </span>
              )}
              <span className="text-zinc-500">{selectedContext?.name}</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 lg:text-3xl">
              {selected.title}
            </h2>
            {selected.description && (
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {selected.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => onEditObjective(selected)}
              disabled={isEmpty}
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 disabled:opacity-40"
            >
              {t("actions.edit")}
            </button>
            <button
              onClick={onDeleteObjective}
              disabled={isEmpty}
              className="rounded-md border border-rose-400/20 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
          {selected.startDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {t("started", { date: formatDate(selected.startDate) })}
            </span>
          )}
          {selected.targetDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-400/60" />
              {t("target", { date: formatDate(selected.targetDate) })}
            </span>
          )}
          {selected.source && selected.source !== "self" && (
            <span>{t("sourceLabel", { source: sourceLabel(selected.source) })}</span>
          )}
        </div>

        {selected.successCriteria && (
          <div className="mt-4 rounded-lg border border-emerald-300/10 bg-emerald-300/[0.04] px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300/60">
              {t("fields.successCriteria")}
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {selected.successCriteria}
            </p>
          </div>
        )}

        {selected.resultNotes && (
          <div className="mt-3 rounded-lg border border-amber-300/10 bg-amber-300/[0.04] px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300/60">
              {t("fields.result")}
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {selected.resultNotes}
            </p>
          </div>
        )}
      </div>

      <ObjectiveItems
        completion={completion}
        doneCount={doneCount}
        editingItemId={editingItemId}
        isEmpty={isEmpty}
        itemForm={itemForm}
        items={selected.items}
        newItemTitle={newItemTitle}
        saving={saving}
        totalItems={totalItems}
        onCreateItem={onCreateItem}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        onItemFormChange={onItemFormChange}
        onItemTitleChange={onItemTitleChange}
        onSaveItem={onSaveItem}
        onStopEditingItem={onStopEditingItem}
        onUpdateItemStatus={onUpdateItemStatus}
        itemStatusLabel={itemStatusLabel}
        t={t}
      />

      <ObjectiveOutcomes
        editingOutcomeId={editingOutcomeId}
        isEmpty={isEmpty}
        newOutcomeTitle={newOutcomeTitle}
        newOutcomeType={newOutcomeType}
        outcomeForm={outcomeForm}
        outcomes={selected.outcomes}
        saving={saving}
        onCreateOutcome={onCreateOutcome}
        onDeleteOutcome={onDeleteOutcome}
        onEditOutcome={onEditOutcome}
        onNewOutcomeTitleChange={onNewOutcomeTitleChange}
        onNewOutcomeTypeChange={onNewOutcomeTypeChange}
        onOutcomeFormChange={onOutcomeFormChange}
        onSaveOutcome={onSaveOutcome}
        onStopEditingOutcome={onStopEditingOutcome}
        onUpdateOutcomeStatus={onUpdateOutcomeStatus}
        outcomeLabel={outcomeLabel}
        outcomeStatusLabel={outcomeStatusLabel}
        t={t}
      />
    </section>
  );
}
