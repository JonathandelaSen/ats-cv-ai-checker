import type { FeedbackStatus } from "@/modules/feedback-notes";

export function normalizeRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeOptionalText(value: unknown) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

export function normalizeStatus(value: unknown): FeedbackStatus | "all" | null {
  if (value === null || value === undefined || value === "") return "active";
  if (value === "active" || value === "closed" || value === "all") return value;
  return null;
}
