import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { FeedbackStatus } from "@/modules/feedback-notes";

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
