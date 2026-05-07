import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAnalysis, getCV, type Analysis, type CVRecord } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

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

export function normalizeOptionalLink(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

export function normalizeRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function validateQuestionLinks(
  supabase: SupabaseClient,
  userId: string,
  input: {
    cv_id?: string | null;
    analysis_id?: string | null;
  }
): Promise<
  | { ok: true; cv: CVRecord | null; analysis: Analysis | null }
  | { ok: false; response: NextResponse }
> {
  let cv: CVRecord | null = null;
  let analysis: Analysis | null = null;

  if (input.cv_id) {
    cv = await getCV(supabase, input.cv_id, userId);
    if (!cv) {
      return {
        ok: false,
        response: NextResponse.json({ error: "CV not found" }, { status: 404 }),
      };
    }
  }

  if (input.analysis_id) {
    analysis = await getAnalysis(supabase, input.analysis_id, userId);
    if (!analysis) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Offer not found" },
          { status: 404 }
        ),
      };
    }
    if (analysis.analysis_mode !== "job_match") {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Only job match analyses can be linked as offers" },
          { status: 400 }
        ),
      };
    }
  }

  return { ok: true, cv, analysis };
}
