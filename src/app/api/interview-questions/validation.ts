import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAnalysisFacade } from "@/lib/analysis-facade";
import { cvLibraryModule } from "@/lib/container";
import { createClient } from "@/lib/supabase/server";
import { presentCVDocument, type CVDocumentResponse } from "@/modules/cv-library";

type QuestionAnalysis = NonNullable<
  Awaited<ReturnType<typeof getAnalysisFacade>>
>;

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
  | { ok: true; cv: CVDocumentResponse | null; analysis: QuestionAnalysis | null }
  | { ok: false; response: NextResponse }
> {
  let cv: CVDocumentResponse | null = null;
  let analysis: QuestionAnalysis | null = null;

  if (input.cv_id) {
    const document = await cvLibraryModule
      .bindRequest(supabase)
      .getCVDocument.execute({ id: input.cv_id, userId });
    cv = document ? presentCVDocument(document) : null;
    if (!cv) {
      return {
        ok: false,
        response: NextResponse.json({ error: "CV not found" }, { status: 404 }),
      };
    }
  }

  if (input.analysis_id) {
    analysis = await getAnalysisFacade(supabase, input.analysis_id, userId);
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
