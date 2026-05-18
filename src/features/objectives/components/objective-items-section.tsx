import { Calendar, Check, Circle, Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import type { ObjectiveItem, ObjectiveItemStatus } from "../api/objectives-api";
import { formatDate, inputClass, itemStatusLabels, selectClass, textareaClass, type ItemEditForm } from "./objectives-ui";

interface ObjectiveItemsProps {
  completion: number;
  doneCount: number;
  editingItemId: string | null;
  isEmpty: boolean;
  itemForm: ItemEditForm | null;
  items: ObjectiveItem[];
  newItemTitle: string;
  saving: boolean;
  totalItems: number;
  onCreateItem: () => void;
  onDeleteItem: (item: ObjectiveItem) => void;
  onEditItem: (item: ObjectiveItem) => void;
  onItemFormChange: (form: ItemEditForm) => void;
  onItemTitleChange: (title: string) => void;
  onSaveItem: () => void;
  onStopEditingItem: () => void;
  onUpdateItemStatus: (item: ObjectiveItem, status: ObjectiveItemStatus) => void;
  itemStatusLabel: (status: ObjectiveItemStatus) => string;
  t: (key: string, values?: Record<string, number | string>) => string;
}

export function ObjectiveItems({
  completion,
  doneCount,
  editingItemId,
  isEmpty,
  itemForm,
  items,
  newItemTitle,
  saving,
  totalItems,
  onCreateItem,
  onDeleteItem,
  onEditItem,
  onItemFormChange,
  onItemTitleChange,
  onSaveItem,
  onStopEditingItem,
  onUpdateItemStatus,
  itemStatusLabel,
  t,
}: ObjectiveItemsProps) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">{t("items.title")}</h3>
        <span className="text-xs text-zinc-500">
          {t("items.progress", { done: doneCount, total: totalItems, completion })}
        </span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-emerald-300 transition-all"
          style={{ width: `${completion}%` }}
        />
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isEditing = editingItemId === item.id && itemForm;
          return (
            <div key={item.id} className="group rounded-lg border border-white/10 bg-black/20">
              {isEditing && itemForm ? (
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300/70">
                      {t("items.edit")}
                    </span>
                    <button
                      onClick={onStopEditingItem}
                      className="text-zinc-500 hover:text-zinc-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    className={inputClass}
                    value={itemForm.title}
                    onChange={(e) =>
                      onItemFormChange({ ...itemForm, title: e.target.value })
                    }
                    placeholder={t("fields.title")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-[11px] text-zinc-500">
                        {t("fields.status")}
                      </span>
                      <select
                        className={`${selectClass} w-full`}
                        value={itemForm.status}
                        onChange={(e) =>
                          onItemFormChange({
                            ...itemForm,
                            status: e.target.value as ObjectiveItemStatus,
                          })
                        }
                      >
                        {Object.keys(itemStatusLabels).map((key) => (
                          <option key={key} value={key}>
                            {itemStatusLabel(key as ObjectiveItemStatus)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-[11px] text-zinc-500">
                        {t("fields.dueDate")}
                      </span>
                      <input
                        type="date"
                        className={inputClass}
                        value={itemForm.dueDate}
                        onChange={(e) =>
                          onItemFormChange({ ...itemForm, dueDate: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label className="block space-y-1">
                    <span className="text-[11px] text-zinc-500">
                      {t("fields.notes")}
                    </span>
                    <textarea
                      className={textareaClass}
                      rows={2}
                      value={itemForm.notes}
                      onChange={(e) =>
                        onItemFormChange({ ...itemForm, notes: e.target.value })
                      }
                      placeholder={t("placeholders.itemNotes")}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] text-zinc-500">
                      {t("fields.evidence")}
                    </span>
                    <textarea
                      className={textareaClass}
                      rows={2}
                      value={itemForm.evidenceNotes}
                      onChange={(e) =>
                        onItemFormChange({
                          ...itemForm,
                          evidenceNotes: e.target.value,
                        })
                      }
                      placeholder={t("placeholders.evidence")}
                    />
                  </label>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={onStopEditingItem}
                      className="rounded-md px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5"
                    >
                      {t("actions.cancel")}
                    </button>
                    <button
                      onClick={onSaveItem}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-200 disabled:opacity-60"
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
                  <button
                    onClick={() =>
                      onUpdateItemStatus(
                        item,
                        item.status === "done" ? "todo" : "done"
                      )
                    }
                    className="mt-0.5 shrink-0 text-emerald-200"
                  >
                    {item.status === "done" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        item.status === "done"
                          ? "text-zinc-500 line-through"
                          : "text-zinc-100"
                      }`}
                    >
                      {item.title}
                    </p>
                    {(item.notes || item.evidenceNotes || item.dueDate) && (
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        {item.dueDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.dueDate)}
                          </span>
                        )}
                        {item.notes && <span className="text-zinc-500">{item.notes}</span>}
                      </div>
                    )}
                    {item.evidenceNotes && (
                      <p className="mt-1 text-xs italic text-zinc-600">
                        {item.evidenceNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => onEditItem(item)}
                      className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item)}
                      className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className={inputClass}
          placeholder={t("items.addPlaceholder")}
          value={newItemTitle}
          onChange={(e) => onItemTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onCreateItem();
          }}
          disabled={isEmpty}
        />
        <button
          onClick={onCreateItem}
          disabled={saving || isEmpty}
          className="shrink-0 rounded-md bg-emerald-300 px-3 text-sm font-semibold text-emerald-950 disabled:opacity-40"
        >
          {t("actions.add")}
        </button>
      </div>
    </div>
  );
}

