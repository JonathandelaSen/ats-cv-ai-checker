import type { ActivityContextStatus, ActivityContextType } from "@/modules/activity-context";

type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

const contextTypes = ["employment", "project", "personal", "other"] as const;
const contextStatuses = ["active", "archived"] as const;

export interface CreateActivityContextHttpInput {
  type: ActivityContextType;
  name: string;
}

export interface UpdateActivityContextHttpInput {
  type?: ActivityContextType;
  name?: string;
  status?: ActivityContextStatus;
}

export interface ActivityContextSuggestionHttpInput {
  action: "promote" | "hide";
  type: ActivityContextType;
  name: string;
  roleOrLabel: string | null;
}

function validationError(message: string): Result<never, HttpValidationError> {
  return { ok: false, error: { message, status: 400 } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > 160) return null;
  return normalized;
}

function requiredEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  return allowed.includes(value as T) ? (value as T) : null;
}

function optionalEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export function parseCreateActivityContextRequest(
  body: unknown,
): Result<CreateActivityContextHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const type = requiredEnum(body.type, contextTypes);
  const name = requiredText(body.name);
  if (!type || !name) return validationError("Invalid activity context payload");
  return { ok: true, value: { type, name } };
}

export function parseUpdateActivityContextRequest(
  body: unknown,
): Result<UpdateActivityContextHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const type = optionalEnum(body.type, contextTypes);
  const status = optionalEnum(body.status, contextStatuses);
  const name = body.name === undefined ? undefined : requiredText(body.name);
  if (name === null) return validationError("Invalid activity context payload");
  if (body.type !== undefined && !type) return validationError("Invalid activity context type");
  if (body.status !== undefined && !status) return validationError("Invalid activity context status");
  return { ok: true, value: { type, name: name ?? undefined, status } };
}

export function parseActivityContextSuggestionRequest(
  body: unknown,
): Result<ActivityContextSuggestionHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const action = requiredEnum(body.action, ["promote", "hide"] as const);
  const type = requiredEnum(body.type, contextTypes);
  const name = requiredText(body.name);
  const roleOrLabel =
    body.roleOrLabel === null || body.role_or_label === null
      ? null
      : typeof body.roleOrLabel === "string"
        ? body.roleOrLabel.trim() || null
        : typeof body.role_or_label === "string"
          ? body.role_or_label.trim() || null
          : null;
  if (!action || !type || !name) {
    return validationError("Invalid activity context suggestion payload");
  }
  return { ok: true, value: { action, type, name, roleOrLabel } };
}
