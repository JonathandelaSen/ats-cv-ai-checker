import { Loader2, Pencil, Save, Trash2, Trophy, X } from "lucide-react";
import type { ObjectiveOutcome, ObjectiveOutcomeStatus, ObjectiveOutcomeType } from "../api/objectives-api";
import { inputClass, outcomeLabels, selectClass, textareaClass, type OutcomeEditForm } from "./objectives-ui";

interface ObjectiveOutcomesProps {
  editingOutcomeId: string | null;
  isEmpty: boolean;
  newOutcomeTitle: string;
  newOutcomeType: ObjectiveOutcomeType;
  outcomeForm: OutcomeEditForm | null;
  outcomes: ObjectiveOutcome[];
  saving: boolean;
  onCreateOutcome: () => void;
  onDeleteOutcome: (outcome: ObjectiveOutcome) => void;
  onEditOutcome: (outcome: ObjectiveOutcome) => void;
  onNewOutcomeTitleChange: (title: string) => void;
  onNewOutcomeTypeChange: (type: ObjectiveOutcomeType) => void;
  onOutcomeFormChange: (form: OutcomeEditForm) => void;
  onSaveOutcome: () => void;
  onStopEditingOutcome: () => void;
  onUpdateOutcomeStatus: (
    outcome: ObjectiveOutcome,
    status: ObjectiveOutcomeStatus
  ) => void;
  outcomeLabel: (type: ObjectiveOutcomeType) => string;
  outcomeStatusLabel: (status: ObjectiveOutcomeStatus) => string;
  t: (key: string) => string;
}

export function ObjectiveOutcomes({
  editingOutcomeId,
  isEmpty,
  newOutcomeTitle,
  newOutcomeType,
  outcomeForm,
  outcomes,
  saving,
  onCreateOutcome,
  onDeleteOutcome,
  onEditOutcome,
  onNewOutcomeTitleChange,
  onNewOutcomeTypeChange,
  onOutcomeFormChange,
  onSaveOutcome,
  onStopEditingOutcome,
  onUpdateOutcomeStatus,
  outcomeLabel,
  outcomeStatusLabel,
  t,
}: ObjectiveOutcomesProps) {
  return (
    <div className="mt-8">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-100">
        <Trophy className="h-4 w-4 text-amber-300/60" />
        {t("outcomes.title")}
      </h3>

      <div className="space-y-2">
        {outcomes.map((outcome) => {
          const isEditing = editingOutcomeId === outcome.id && outcomeForm;
          return (
            <div
              key={outcome.id}
              className="group rounded-lg border border-amber-300/15 bg-amber-300/[0.04]"
            >
              {isEditing && outcomeForm ? (
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300/70">
                      {t("outcomes.edit")}
                    </span>
                    <button
                      onClick={onStopEditingOutcome}
                      className="text-zinc-500 hover:text-zinc-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    className={inputClass}
                    value={outcomeForm.title}
                    onChange={(e) =>
                      onOutcomeFormChange({
                        ...outcomeForm,
                        title: e.target.value,
                      })
                    }
                    placeholder={t("outcomes.titlePlaceholder")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-[11px] text-zinc-500">
                        {t("fields.type")}
                      </span>
                      <select
                        className={`${selectClass} w-full`}
                        value={outcomeForm.type}
                        onChange={(e) =>
                          onOutcomeFormChange({
                            ...outcomeForm,
                            type: e.target.value as ObjectiveOutcomeType,
                          })
                        }
                      >
                        {Object.keys(outcomeLabels).map((key) => (
                          <option key={key} value={key}>
                            {outcomeLabel(key as ObjectiveOutcomeType)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-zinc-500">
                        {t("fields.status")}
                      </span>
                      <select
                        className={`${selectClass} w-full`}
                        value={outcomeForm.status}
                        onChange={(e) =>
                          onOutcomeFormChange({
                            ...outcomeForm,
                            status: e.target.value as ObjectiveOutcomeStatus,
                          })
                        }
                      >
                        {["expected", "achieved", "missed"].map((status) => (
                          <option key={status} value={status}>
                            {outcomeStatusLabel(status as ObjectiveOutcomeStatus)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {(outcomeForm.type === "money" || outcomeForm.amount) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-[11px] text-zinc-500">
                          {t("fields.amount")}
                        </span>
                        <input
                          type="number"
                          className={inputClass}
                          value={outcomeForm.amount}
                          onChange={(e) =>
                            onOutcomeFormChange({
                              ...outcomeForm,
                              amount: e.target.value,
                            })
                          }
                          placeholder="0"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] text-zinc-500">
                          {t("fields.currency")}
                        </span>
                        <input
                          className={inputClass}
                          value={outcomeForm.currency}
                          onChange={(e) =>
                            onOutcomeFormChange({
                              ...outcomeForm,
                              currency: e.target.value,
                            })
                          }
                          placeholder="EUR"
                        />
                      </label>
                    </div>
                  )}
                  <label className="block space-y-1">
                    <span className="text-[11px] text-zinc-500">
                      {t("fields.description")}
                    </span>
                    <textarea
                      className={textareaClass}
                      rows={2}
                      value={outcomeForm.description}
                      onChange={(e) =>
                        onOutcomeFormChange({
                          ...outcomeForm,
                          description: e.target.value,
                        })
                      }
                      placeholder={t("outcomes.descriptionPlaceholder")}
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={onStopEditingOutcome}
                      className="rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5"
                    >
                      {t("actions.cancel")}
                    </button>
                    <button
                      onClick={onSaveOutcome}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-md bg-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-200 disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      {t("actions.save")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-50">
                      {outcome.title}
                    </p>
                    {outcome.description && (
                      <p className="mt-1 text-xs leading-relaxed text-amber-100/50">
                        {outcome.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-amber-100/40">
                      <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-2 py-0.5">
                        {outcomeLabel(outcome.type)}
                      </span>
                      <span>{outcomeStatusLabel(outcome.status)}</span>
                      {outcome.amount != null && (
                        <span>
                          {outcome.amount} {outcome.currency}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <select
                      className="rounded-md border border-amber-300/20 bg-black/20 px-2 py-1 text-xs text-amber-50"
                      value={outcome.status}
                      onChange={(e) =>
                        onUpdateOutcomeStatus(
                          outcome,
                          e.target.value as ObjectiveOutcomeStatus
                        )
                      }
                      disabled={isEmpty}
                    >
                      {["expected", "achieved", "missed"].map((status) => (
                        <option key={status} value={status}>
                          {outcomeStatusLabel(status as ObjectiveOutcomeStatus)}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => onEditOutcome(outcome)}
                        className="rounded p-1 text-amber-200/40 hover:bg-white/5 hover:text-amber-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteOutcome(outcome)}
                        className="rounded p-1 text-amber-200/40 hover:bg-white/5 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <select
          className={`${selectClass} shrink-0 px-2 py-1.5`}
          value={newOutcomeType}
          onChange={(e) =>
            onNewOutcomeTypeChange(e.target.value as ObjectiveOutcomeType)
          }
          disabled={isEmpty}
        >
          {Object.keys(outcomeLabels).map((key) => (
            <option key={key} value={key}>
              {outcomeLabel(key as ObjectiveOutcomeType)}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder={t("outcomes.addPlaceholder")}
          value={newOutcomeTitle}
          onChange={(e) => onNewOutcomeTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onCreateOutcome();
          }}
          disabled={isEmpty}
        />
        <button
          onClick={onCreateOutcome}
          disabled={saving || isEmpty}
          className="shrink-0 rounded-md bg-amber-300 px-3 text-sm font-semibold text-amber-950 disabled:opacity-40"
        >
          {t("actions.add")}
        </button>
      </div>
    </div>
  );
}
