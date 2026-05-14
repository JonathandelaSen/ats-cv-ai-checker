import type { FeedbackStatus } from "@/modules/feedback-notes";

type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

export interface CreateFeedbackHttpInput {
  person_name: string;
  final_feedback: string | null;
}

export interface UpdateFeedbackHttpInput {
  person_name?: string;
  final_feedback?: string | null;
}

export interface FeedbackEntryContentHttpInput {
  content: string;
}

export interface GenerateFeedbackHttpInput {
  geminiApiKey: string;
  model: string;
}

function validationError(message: string): Result<never, HttpValidationError> {
  return { ok: false, error: { message, status: 400 } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRequiredText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeOptionalText(value: unknown) {
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

export function parseListFeedbacksRequest(
  params: URLSearchParams
): Result<{ status: FeedbackStatus | "all" }, HttpValidationError> {
  const status = normalizeStatus(params.get("status"));
  if (!status) return validationError("Invalid status");
  return { ok: true, value: { status } };
}

export function parseCreateFeedbackRequest(
  body: unknown
): Result<CreateFeedbackHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const person_name = normalizeRequiredText(body.person_name);
  const final_feedback =
    body.final_feedback === undefined ? null : normalizeOptionalText(body.final_feedback);
  if (!person_name || final_feedback === undefined) {
    return validationError("Invalid feedback payload");
  }
  return { ok: true, value: { person_name, final_feedback } };
}

export function parseUpdateFeedbackRequest(
  body: unknown
): Result<UpdateFeedbackHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const updates: UpdateFeedbackHttpInput = {};
  if (body.person_name !== undefined) {
    const personName = normalizeRequiredText(body.person_name);
    if (!personName) return validationError("Person name is required");
    updates.person_name = personName;
  }
  if (body.final_feedback !== undefined) {
    const finalFeedback = normalizeOptionalText(body.final_feedback);
    if (finalFeedback === undefined) return validationError("Invalid final feedback");
    updates.final_feedback = finalFeedback;
  }
  return { ok: true, value: updates };
}

export function parseFeedbackEntryContentRequest(
  body: unknown
): Result<FeedbackEntryContentHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const content = normalizeRequiredText(body.content);
  if (!content) return validationError("Entry content is required");
  return { ok: true, value: { content } };
}

export function parseGenerateFeedbackRequest(
  body: unknown
): Result<GenerateFeedbackHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const geminiApiKey = normalizeRequiredText(body.geminiApiKey);
  const model = normalizeRequiredText(body.model) ?? "gemini-3.1-pro-preview";
  if (!geminiApiKey) {
    return validationError("Configura tu API key de Gemini antes de generar feedback.");
  }
  return { ok: true, value: { geminiApiKey, model } };
}
