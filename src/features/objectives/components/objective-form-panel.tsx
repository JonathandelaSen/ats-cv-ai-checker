import { FolderKanban, Loader2, Save, X } from "lucide-react";
import type {
  ObjectiveContext,
  ObjectivePriority,
  ObjectiveSource,
  ObjectiveStatus,
} from "../api/objectives-api";
import {
  inputClass,
  selectClass,
  statusLabels,
  textareaClass,
  type ObjectiveForm,
} from "./objectives-ui";

interface ObjectiveFormPanelProps {
  contexts: ObjectiveContext[];
  form: ObjectiveForm;
  isCreating: boolean;
  saving: boolean;
  onCancel: () => void;
  onFormChange: (form: ObjectiveForm) => void;
  onManageContexts: () => void;
  onSave: () => void;
  priorityLabel: (priority: ObjectivePriority) => string;
  sourceLabel: (source: ObjectiveSource) => string;
  statusLabel: (status: ObjectiveStatus) => string;
  t: (key: string) => string;
}

export function ObjectiveFormPanel({
  contexts,
  form,
  isCreating,
  saving,
  onCancel,
  onFormChange,
  onManageContexts,
  onSave,
  priorityLabel,
  sourceLabel,
  statusLabel,
  t,
}: ObjectiveFormPanelProps) {
  return (
    <section className="rounded-xl border border-emerald-200/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {isCreating ? t("newObjective") : t("editObjective")}
        </h2>
        <button
          onClick={onCancel}
          className="rounded-md p-2 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">{t("fields.title")}</span>
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => onFormChange({ ...form, title: e.target.value })}
            maxLength={160}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">{t("fields.context")}</span>
            <select
              className={`${selectClass} w-full`}
              value={form.contextId}
              onChange={(e) => onFormChange({ ...form, contextId: e.target.value })}
            >
              {contexts.map((ctx) => (
                <option key={ctx.id} value={ctx.id}>
                  {ctx.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={onManageContexts}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-sm text-zinc-300 hover:bg-white/5"
            >
              <FolderKanban className="h-4 w-4" />
              {t("actions.manageContexts")}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">{t("fields.source")}</span>
            <select
              className={`${selectClass} w-full`}
              value={form.source}
              onChange={(e) =>
                onFormChange({ ...form, source: e.target.value as ObjectiveSource })
              }
            >
              {["manager", "self", "company", "project", "other"].map((source) => (
                <option key={source} value={source}>
                  {sourceLabel(source as ObjectiveSource)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">{t("fields.status")}</span>
            <select
              className={`${selectClass} w-full`}
              value={form.status}
              onChange={(e) =>
                onFormChange({ ...form, status: e.target.value as ObjectiveStatus })
              }
            >
              {Object.keys(statusLabels).map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status as ObjectiveStatus)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">
              {t("fields.priority")}
            </span>
            <select
              className={`${selectClass} w-full`}
              value={form.priority}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  priority: e.target.value as "" | ObjectivePriority,
                })
              }
            >
              <option value="">{t("priority.none")}</option>
              <option value="low">{priorityLabel("low")}</option>
              <option value="medium">{priorityLabel("medium")}</option>
              <option value="high">{priorityLabel("high")}</option>
            </select>
          </label>
          <div />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">
              {t("fields.startDate")}
            </span>
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(e) => onFormChange({ ...form, startDate: e.target.value })}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-500">
              {t("fields.targetDate")}
            </span>
            <input
              type="date"
              className={inputClass}
              value={form.targetDate}
              onChange={(e) => onFormChange({ ...form, targetDate: e.target.value })}
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">
            {t("fields.description")}
          </span>
          <textarea
            className={textareaClass}
            rows={3}
            value={form.description}
            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-500">
            {t("fields.successCriteria")}
          </span>
          <textarea
            className={textareaClass}
            rows={2}
            value={form.successCriteria}
            onChange={(e) =>
              onFormChange({ ...form, successCriteria: e.target.value })
            }
            placeholder={t("placeholders.successCriteria")}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-amber-300/80">
            {t("fields.resultNotes")}
          </span>
          <textarea
            className={textareaClass}
            rows={2}
            value={form.resultNotes}
            onChange={(e) => onFormChange({ ...form, resultNotes: e.target.value })}
            placeholder={t("placeholders.resultNotes")}
          />
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
        >
          {t("actions.cancel")}
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-200 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("actions.save")}
        </button>
      </div>
    </section>
  );
}
