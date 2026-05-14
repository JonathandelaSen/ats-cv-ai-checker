import type { AIContext } from "@/lib/analysis-types";

type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

export interface CreateCVAnalysisHttpInput {
  cvId: string;
  title: string;
  context: AIContext | null;
  model: string;
}

export interface ScoreCVAnalysisHttpInput {
  geminiApiKey: string;
  model: string;
  additionalContext: string | null;
}

function validationError(message: string): Result<never, HttpValidationError> {
  return { ok: false, error: { message, status: 400 } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseCreateCVAnalysisRequest(
  body: unknown
): Result<CreateCVAnalysisHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const cvId = text(body.cvId);
  const title = text(body.title);
  const model = text(body.model) || "gemini-3.1-pro-preview";
  if (!cvId) return validationError("cvId is required");
  if (!title) return validationError("Title is required");
  return {
    ok: true,
    value: { cvId, title, context: (body.context as AIContext | undefined) ?? null, model },
  };
}

export function parseScoreCVAnalysisRequest(
  body: unknown
): Result<ScoreCVAnalysisHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const geminiApiKey = text(body.geminiApiKey);
  const model = text(body.model) || "gemini-3.1-pro-preview";
  const additionalContext = typeof body.additionalContext === "string"
    ? body.additionalContext.trim() || null
    : null;
  if (!geminiApiKey) {
    return validationError("Configura tu API key de Gemini en Configuración antes de lanzar el análisis.");
  }
  return { ok: true, value: { geminiApiKey, model, additionalContext } };
}
