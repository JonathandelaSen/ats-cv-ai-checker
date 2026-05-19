import { OFFER_STATUSES, type OfferStatus } from "@/lib/analysis-types";
import { parseAIRequestConfig, type AIRequestConfig } from "@/app/api/_shared/ai-request";

type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

export interface CreateJobMatchAnalysisHttpInput {
  cvId: string;
  title: string;
  jobDescription: string;
  jobUrl: string | null;
  model: string;
}

export interface ScoreJobMatchAnalysisHttpInput extends AIRequestConfig {
  jobDescription: string;
  jobUrl: string | null;
}

export interface UpdateJobMatchAnalysisHttpInput {
  allowedUpdates: { job_url?: string | null };
  followUpUpdates: {
    status?: OfferStatus;
    notes?: string | null;
    nextAction?: string | null;
    nextActionAt?: string | null;
  };
  includesOfferTracking: boolean;
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

function optionalText(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function optionalDate(value: unknown) {
  const normalized = optionalText(value);
  if (normalized === null || normalized === undefined) return normalized;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function parseCreateJobMatchAnalysisRequest(
  body: unknown
): Result<CreateJobMatchAnalysisHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const cvId = text(body.cvId);
  const title = text(body.title);
  const jobDescription = text(body.jobDescription);
  const jobUrl = text(body.jobUrl) || null;
  const model = text(body.model) || "gemini-3.1-pro-preview";
  if (!cvId) return validationError("cvId is required");
  if (!title) return validationError("Title is required");
  if (!jobDescription) return validationError("Job description is required for job match analysis");
  return { ok: true, value: { cvId, title, jobDescription, jobUrl, model } };
}

export function parseScoreJobMatchAnalysisRequest(
  body: unknown
): Result<ScoreJobMatchAnalysisHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const ai = parseAIRequestConfig(body);
  const jobDescription = text(body.jobDescription);
  const jobUrl = text(body.jobUrl) || null;
  if (!ai.ok) return validationError(ai.message);
  if (!jobDescription) return validationError("Job description is required for job match analysis");
  return { ok: true, value: { ...ai.value, jobDescription, jobUrl } };
}

export function parseUpdateJobMatchAnalysisRequest(
  body: unknown
): Result<UpdateJobMatchAnalysisHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const allowedUpdates: UpdateJobMatchAnalysisHttpInput["allowedUpdates"] = {};
  const followUpUpdates: UpdateJobMatchAnalysisHttpInput["followUpUpdates"] = {};

  if (body.job_url !== undefined) {
    const jobUrl = optionalText(body.job_url);
    if (jobUrl === undefined) return validationError("Invalid job URL");
    allowedUpdates.job_url = jobUrl;
  }
  if (body.offer_status !== undefined) {
    if (typeof body.offer_status !== "string" || !OFFER_STATUSES.includes(body.offer_status as OfferStatus)) {
      return validationError("Invalid offer status");
    }
    followUpUpdates.status = body.offer_status as OfferStatus;
  }
  if (body.offer_notes !== undefined) {
    const offerNotes = optionalText(body.offer_notes);
    if (offerNotes === undefined) return validationError("Invalid offer notes");
    followUpUpdates.notes = offerNotes;
  }
  if (body.offer_next_action !== undefined) {
    const nextAction = optionalText(body.offer_next_action);
    if (nextAction === undefined) return validationError("Invalid offer next action");
    followUpUpdates.nextAction = nextAction;
  }
  if (body.offer_next_action_at !== undefined) {
    const nextActionAt = optionalDate(body.offer_next_action_at);
    if (nextActionAt === undefined) return validationError("Invalid offer next action date");
    followUpUpdates.nextActionAt = nextActionAt;
  }

  const includesOfferTracking =
    followUpUpdates.status !== undefined ||
    followUpUpdates.notes !== undefined ||
    followUpUpdates.nextAction !== undefined ||
    followUpUpdates.nextActionAt !== undefined;
  if (Object.keys(allowedUpdates).length === 0 && !includesOfferTracking) {
    return validationError("No valid fields to update");
  }
  return { ok: true, value: { allowedUpdates, followUpUpdates, includesOfferTracking } };
}
