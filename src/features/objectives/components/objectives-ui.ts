import type {
  ObjectiveItemStatus,
  ObjectiveOutcomeStatus,
  ObjectiveOutcomeType,
  ObjectivePriority,
  ObjectiveSource,
  ObjectiveStatus,
} from "../api/objectives-api";

export interface ObjectiveForm {
  contextId: string;
  title: string;
  description: string;
  successCriteria: string;
  resultNotes: string;
  source: ObjectiveSource;
  status: ObjectiveStatus;
  priority: "" | ObjectivePriority;
  startDate: string;
  targetDate: string;
}

export interface ItemEditForm {
  title: string;
  notes: string;
  evidenceNotes: string;
  status: ObjectiveItemStatus;
  dueDate: string;
}

export interface OutcomeEditForm {
  title: string;
  description: string;
  type: ObjectiveOutcomeType;
  status: ObjectiveOutcomeStatus;
  amount: string;
  currency: string;
}

export const inputClass =
  "w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-300/60";

export const textareaClass =
  "w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-emerald-300/60";

export const selectClass =
  "rounded-md border border-white/10 bg-[#11140f] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-300/60";

export const statusLabels: Record<ObjectiveStatus, string> = {
  active: "Active",
  paused: "Paused",
  achieved: "Achieved",
  missed: "Missed",
  cancelled: "Cancelled",
};

export const outcomeLabels: Record<ObjectiveOutcomeType, string> = {
  promotion: "Promotion",
  role_change: "Role",
  leadership: "Leadership",
  mentoring: "Mentoring",
  money: "Money",
  recognition: "Recognition",
  learning: "Learning",
  other: "Other",
};

export const itemStatusLabels: Record<ObjectiveItemStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
};

export function formatDate(d: string | null): string {
  if (!d) return "";
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function statusClass(status: ObjectiveStatus): string {
  const base = "rounded-full border px-2 py-1 text-[11px] font-semibold";
  if (status === "achieved") {
    return `${base} border-emerald-300/25 bg-emerald-300/10 text-emerald-200`;
  }
  if (status === "active") {
    return `${base} border-sky-300/20 bg-sky-300/10 text-sky-200`;
  }
  if (status === "paused") {
    return `${base} border-zinc-300/15 bg-zinc-300/10 text-zinc-300`;
  }
  if (status === "missed") {
    return `${base} border-rose-300/20 bg-rose-300/10 text-rose-200`;
  }
  return `${base} border-zinc-500/20 bg-zinc-500/10 text-zinc-400`;
}
