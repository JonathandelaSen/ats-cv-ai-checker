import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Analysis } from "@/lib/analysis-types";
import {
  cvAnalysisModule,
  cvLibraryModule,
  jobMatchAnalysisModule,
} from "@/lib/container";
import { presentCVAnalysis } from "@/modules/cv-analysis";
import { presentJobMatchAnalysis } from "@/modules/job-match-analysis";
import { presentCVDocument, type CVDocumentResponse } from "@/modules/cv-library";

type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

export interface ListInterviewQuestionsHttpInput {
  search: string | null;
  cvId: string | null;
  analysisId: string | null;
  answered: boolean | null;
}

export interface CreateInterviewQuestionHttpInput {
  question: string;
  context: string | null;
  answer: string | null;
  cv_id: string | null;
  analysis_id: string | null;
}

export interface UpdateInterviewQuestionHttpInput {
  question?: string;
  context?: string | null;
  answer?: string | null;
  legacyCvId?: string | null;
  sourceJobMatchAnalysisId?: string | null;
}

export interface GenerateInterviewQuestionHttpInput {
  geminiApiKey: string;
  model: string;
  context: string;
  cv_id: string | null;
  analysis_id: string | null;
}

export interface EditInterviewQuestionHttpInput {
  geminiApiKey: string;
  model: string;
  context: string;
  instruction: string;
}

function validationError(message: string): Result<never, HttpValidationError> {
  return { ok: false, error: { message, status: 400 } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalText(value: unknown) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function normalizeOptionalLink(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function normalizeRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseAnswered(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function parseListInterviewQuestionsRequest(
  params: URLSearchParams
): Result<ListInterviewQuestionsHttpInput, HttpValidationError> {
  return {
    ok: true,
    value: {
      search: params.get("q"),
      cvId: params.get("cvId"),
      analysisId: params.get("analysisId"),
      answered: parseAnswered(params.get("answered")),
    },
  };
}

export function parseCreateInterviewQuestionRequest(
  body: unknown
): Result<CreateInterviewQuestionHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const question = normalizeRequiredText(body.question);
  if (!question) return validationError("Question is required");
  const context = body.context === undefined ? null : normalizeOptionalText(body.context);
  const answer = body.answer === undefined ? null : normalizeOptionalText(body.answer);
  const cv_id = normalizeOptionalLink(body.cv_id);
  const analysis_id = normalizeOptionalLink(body.analysis_id);
  if (context === undefined || answer === undefined || cv_id === undefined || analysis_id === undefined) {
    return validationError("Invalid payload");
  }
  return { ok: true, value: { question, context, answer, cv_id, analysis_id } };
}

export function parseUpdateInterviewQuestionRequest(
  body: unknown
): Result<UpdateInterviewQuestionHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const updates: UpdateInterviewQuestionHttpInput = {};
  if (body.question !== undefined) {
    const question = normalizeRequiredText(body.question);
    if (!question) return validationError("Question is required");
    updates.question = question;
  }
  for (const key of ["context", "answer", "cv_id", "analysis_id"] as const) {
    if (body[key] === undefined) continue;
    const normalized = normalizeOptionalText(body[key]);
    if (normalized === undefined) return validationError(`Invalid ${key}`);
    if (key === "cv_id") updates.legacyCvId = normalized;
    else if (key === "analysis_id") updates.sourceJobMatchAnalysisId = normalized;
    else updates[key] = normalized;
  }
  if (Object.keys(updates).length === 0) return validationError("No valid fields to update");
  return { ok: true, value: updates };
}

export function parseGenerateInterviewQuestionRequest(
  body: unknown,
  existing: { context: string | null; cv_id: string | null; analysis_id: string | null }
): Result<GenerateInterviewQuestionHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const geminiApiKey = normalizeOptionalText(body.geminiApiKey);
  const model = normalizeOptionalText(body.model) ?? "gemini-3.1-pro-preview";
  const context = normalizeOptionalText(body.context) ?? existing.context;
  const cv_id = body.cv_id === undefined ? existing.cv_id : normalizeOptionalText(body.cv_id);
  const analysis_id = body.analysis_id === undefined ? existing.analysis_id : normalizeOptionalText(body.analysis_id);
  if (!geminiApiKey) return validationError("Configura tu API key de Gemini antes de generar respuestas.");
  if (!context?.trim()) return validationError("Context is required for AI generation");
  if (cv_id === undefined || analysis_id === undefined) return validationError("Invalid links");
  return { ok: true, value: { geminiApiKey, model, context, cv_id, analysis_id } };
}

export function parseEditInterviewQuestionRequest(
  body: unknown,
  existingContext: string | null
): Result<EditInterviewQuestionHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const geminiApiKey = normalizeOptionalText(body.geminiApiKey);
  const model = normalizeOptionalText(body.model) ?? "gemini-3.1-pro-preview";
  const instruction = normalizeRequiredText(body.instruction);
  const context = normalizeOptionalText(body.context) ?? existingContext;
  if (!geminiApiKey) return validationError("Configura tu API key de Gemini antes de editar respuestas.");
  if (!instruction) return validationError("Instruction is required");
  if (!context?.trim()) return validationError("Context is required for AI editing");
  return { ok: true, value: { geminiApiKey, model, context, instruction } };
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
