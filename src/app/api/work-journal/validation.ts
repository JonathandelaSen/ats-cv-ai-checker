import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  ContextType as WorkJournalContextType,
  EntryInputMode as WorkJournalEntryInputMode,
} from "@/modules/work-journal";

export async function getAuthedSupabase(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export function normalizeOptionalText(value: unknown) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

export function normalizeRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeOptionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export function normalizeRequiredDate(value: unknown) {
  if (typeof value !== "string") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function normalizeContextType(value: unknown): WorkJournalContextType | null {
  return value === "employment" || value === "project" ? value : null;
}

export function normalizeInputMode(value: unknown): WorkJournalEntryInputMode | null {
  return value === "manual" || value === "ai_assisted" ? value : null;
}

export function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
