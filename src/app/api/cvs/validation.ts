import type { PublicCVSettingsRequest } from "@/modules/cv-library";

type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

export interface UploadCVHttpInput {
  file: File;
  requestedName: string;
}

export interface UpdateCVDocumentHttpInput extends PublicCVSettingsRequest {
  name?: string;
  profile?: Record<string, unknown>;
  template_locale?: string;
}

export interface SaveTemplateAsCVHttpInput {
  name: string;
}

export interface TemplateCVRequestHttpInput {
  templateId: string;
  locale: string;
  geminiApiKey?: string;
  model: string;
}

export interface StructureCVProfileHttpInput {
  geminiApiKey: string;
  model: string;
  force: boolean;
}

export interface EditCVProfileHttpInput {
  geminiApiKey: string;
  model: string;
  instruction: string;
  templateId?: string;
  locale?: string;
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

export function parseUploadCVFormData(
  formData: FormData
): Result<UploadCVHttpInput, HttpValidationError> {
  const file = formData.get("file");
  const requestedName = String(formData.get("name") ?? "").trim();
  if (!(file instanceof File)) return validationError("No file provided");
  if (file.type !== "application/pdf") return validationError("Solo se permiten archivos PDF.");
  return { ok: true, value: { file, requestedName } };
}

export function parseUpdateCVDocumentRequest(
  body: unknown
): Result<UpdateCVDocumentHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  return { ok: true, value: body as UpdateCVDocumentHttpInput };
}

export function parseSaveTemplateAsCVRequest(
  body: unknown
): Result<SaveTemplateAsCVHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const name = text(body.name);
  if (!name) return validationError("Proporciona un nombre para el nuevo CV.");
  return { ok: true, value: { name } };
}

export function parseTemplateCVRequest(
  body: unknown
): Result<TemplateCVRequestHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  return {
    ok: true,
    value: {
      templateId: text(body.templateId),
      locale: text(body.locale) || "es",
      geminiApiKey: text(body.geminiApiKey) || undefined,
      model: text(body.model) || "gemini-3.1-pro-preview",
    },
  };
}

export function parseStructureCVProfileRequest(
  body: unknown
): Result<StructureCVProfileHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const geminiApiKey = text(body.geminiApiKey);
  if (!geminiApiKey) {
    return validationError("Configura tu API key de Gemini en Configuración antes de estructurar el CV.");
  }
  return {
    ok: true,
    value: {
      geminiApiKey,
      model: text(body.model) || "gemini-3.1-pro-preview",
      force: body.force === true,
    },
  };
}

export function parseEditCVProfileRequest(
  body: unknown
): Result<EditCVProfileHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const geminiApiKey = text(body.geminiApiKey);
  const instruction = text(body.instruction);
  if (!geminiApiKey) return validationError("Configura tu API key de Gemini antes de editar el CV.");
  if (!instruction) return validationError("Escribe una instrucción para editar el CV.");
  return {
    ok: true,
    value: {
      geminiApiKey,
      model: text(body.model) || "gemini-3.1-pro-preview",
      instruction,
      templateId: text(body.templateId) || undefined,
      locale: text(body.locale) || undefined,
    },
  };
}

export function parseTemplatePdfRequest(params: URLSearchParams) {
  return { ok: true, value: { download: params.has("download"), locale: params.get("locale") ?? "es" } } as const;
}
