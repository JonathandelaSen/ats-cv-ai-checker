import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Analysis } from "@/lib/analysis-types";
import {
  cvAnalysisModule,
  cvLibraryModule,
  jobMatchAnalysisModule,
} from "@/lib/container";
import { presentCVAnalysis } from "@/modules/cv-analysis";
import { presentJobMatchAnalysis } from "@/modules/job-match-analysis";
import { presentCVDocument, type CVDocumentResponse } from "@/modules/cv-library";

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

async function getAnalysisById(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<Analysis | null> {
  const cvAnalysis = await cvAnalysisModule
    .bindRequest(supabase)
    .getCVAnalysisById.execute({ id, userId });
  if (cvAnalysis) return presentCVAnalysis(cvAnalysis);

  const jobMatch = await jobMatchAnalysisModule
    .bindRequest(supabase)
    .getJobMatchAnalysisById.execute({ id, userId });
  if (jobMatch) return presentJobMatchAnalysis(jobMatch);

  return null;
}

export async function validateQuestionLinks(
  supabase: SupabaseClient,
  userId: string,
  input: {
    cv_id?: string | null;
    analysis_id?: string | null;
  }
): Promise<
  | { ok: true; cv: CVDocumentResponse | null; analysis: Analysis | null }
  | { ok: false; response: NextResponse }
> {
  let cv: CVDocumentResponse | null = null;
  let analysis: Analysis | null = null;

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
    analysis = await getAnalysisById(supabase, input.analysis_id, userId);
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
