type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

const commitmentSources = ["manager", "self", "company", "project", "other"] as const;
const commitmentStatuses = ["active", "paused", "achieved", "missed", "cancelled"] as const;
const priorities = ["low", "medium", "high"] as const;
const contextTypes = ["employment", "project", "personal", "other"] as const;
const contextStatuses = ["active", "archived"] as const;
const itemStatuses = ["todo", "in_progress", "done", "cancelled"] as const;
const outcomeTypes = ["promotion", "role_change", "leadership", "mentoring", "money", "recognition", "learning", "other"] as const;
const outcomeStatuses = ["expected", "achieved", "missed", "changed"] as const;

export interface CreateCommitmentHttpInput {
  contextId: string;
  title: string;
  source: (typeof commitmentSources)[number];
  description?: string | null;
  successCriteria?: string | null;
  resultNotes?: string | null;
  priority: (typeof priorities)[number] | null;
  startDate?: string | null;
  targetDate?: string | null;
}

export interface UpdateCommitmentHttpInput {
  contextId?: string;
  title?: string;
  description?: string | null;
  successCriteria?: string | null;
  resultNotes?: string | null;
  source?: (typeof commitmentSources)[number];
  status?: (typeof commitmentStatuses)[number];
  priority?: (typeof priorities)[number] | null;
  startDate?: string;
  targetDate?: string | null;
}

export interface CreateCommitmentContextHttpInput {
  type: (typeof contextTypes)[number];
  name: string;
  roleOrLabel?: string | null;
}

export interface UpdateCommitmentContextHttpInput {
  type?: (typeof contextTypes)[number];
  name?: string;
  roleOrLabel?: string | null;
  status?: (typeof contextStatuses)[number];
}

export interface CreateCommitmentItemHttpInput {
  title: string;
  notes?: string | null;
  evidenceNotes?: string | null;
  status?: (typeof itemStatuses)[number];
  dueDate?: string | null;
  orderIndex?: number;
}

export interface UpdateCommitmentItemHttpInput {
  title?: string;
  notes?: string | null;
  evidenceNotes?: string | null;
  status?: (typeof itemStatuses)[number];
  dueDate?: string | null;
  completedAt?: string | null;
  orderIndex?: number;
}

export interface CreateCommitmentOutcomeHttpInput {
  type: (typeof outcomeTypes)[number];
  status?: (typeof outcomeStatuses)[number];
  title: string;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  decidedAt?: string | null;
}

export interface UpdateCommitmentOutcomeHttpInput {
  type?: (typeof outcomeTypes)[number];
  status?: (typeof outcomeStatuses)[number];
  title?: string;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  decidedAt?: string | null;
}

function validationError(message: string): Result<never, HttpValidationError> {
  return { ok: false, error: { message, status: 400 } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function requiredText(value: unknown, max = 160): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > max) return null;
  return normalized;
}

function optionalDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return value;
}

function optionalStringEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function requiredStringEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== "string") return null;
  return allowed.includes(value as T) ? (value as T) : null;
}

function optionalDateTime(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return typeof value === "string" ? value : undefined;
}

export function parseCreateCommitmentRequest(
  body: unknown
): Result<CreateCommitmentHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const contextId = requiredText(body.contextId);
  const title = requiredText(body.title);
  const source = requiredStringEnum(body.source, commitmentSources);
  const description = optionalText(body.description);
  const successCriteria = optionalText(body.successCriteria);
  const resultNotes = optionalText(body.resultNotes);
  const priority = optionalStringEnum(body.priority, priorities) ?? null;
  const startDate = optionalDate(body.startDate);
  const targetDate = optionalDate(body.targetDate);

  if (
    !contextId ||
    !title ||
    !source ||
    (body.description !== undefined && description === undefined) ||
    (body.successCriteria !== undefined && successCriteria === undefined) ||
    (body.resultNotes !== undefined && resultNotes === undefined) ||
    (body.startDate !== undefined && startDate === undefined) ||
    (body.targetDate !== undefined && targetDate === undefined)
  ) {
    return validationError("Invalid commitment payload");
  }

  return { ok: true, value: { contextId, title, source, description, successCriteria, resultNotes, priority, startDate, targetDate } };
}

export function parseUpdateCommitmentRequest(
  body: unknown
): Result<UpdateCommitmentHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const contextId = body.contextId === undefined ? undefined : requiredText(body.contextId);
  const title = body.title === undefined ? undefined : requiredText(body.title);
  const description = optionalText(body.description);
  const successCriteria = optionalText(body.successCriteria);
  const resultNotes = optionalText(body.resultNotes);
  const source = optionalStringEnum(body.source, commitmentSources);
  const status = optionalStringEnum(body.status, commitmentStatuses);
  const priority = body.priority === null ? null : optionalStringEnum(body.priority, priorities);
  const startDate = optionalDate(body.startDate);
  const targetDate = optionalDate(body.targetDate);

  if (
    contextId === null ||
    title === null ||
    (body.description !== undefined && description === undefined) ||
    (body.successCriteria !== undefined && successCriteria === undefined) ||
    (body.resultNotes !== undefined && resultNotes === undefined) ||
    (body.startDate !== undefined && startDate === undefined) ||
    (body.targetDate !== undefined && targetDate === undefined)
  ) {
    return validationError("Invalid commitment payload");
  }

  return {
    ok: true,
    value: {
      contextId: contextId ?? undefined,
      title: title ?? undefined,
      description,
      successCriteria,
      resultNotes,
      source,
      status,
      priority,
      startDate: startDate ?? undefined,
      targetDate,
    },
  };
}

export function parseCreateCommitmentContextRequest(
  body: unknown
): Result<CreateCommitmentContextHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const type = requiredStringEnum(body.type, contextTypes);
  const name = requiredText(body.name);
  const roleOrLabel = optionalText(body.roleOrLabel);
  if (!type || !name || (body.roleOrLabel !== undefined && roleOrLabel === undefined)) {
    return validationError("Invalid commitment context payload");
  }
  return { ok: true, value: { type, name, roleOrLabel } };
}

export function parseUpdateCommitmentContextRequest(
  body: unknown
): Result<UpdateCommitmentContextHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const type = optionalStringEnum(body.type, contextTypes);
  const name = body.name === undefined ? undefined : requiredText(body.name);
  const roleOrLabel = optionalText(body.roleOrLabel);
  const status = optionalStringEnum(body.status, contextStatuses);
  if (name === null || roleOrLabel === undefined) {
    return validationError("Invalid commitment context payload");
  }
  return { ok: true, value: { type, name, roleOrLabel, status } };
}

export function parseCreateCommitmentItemRequest(
  body: unknown
): Result<CreateCommitmentItemHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const title = requiredText(body.title);
  const notes = optionalText(body.notes);
  const evidenceNotes = optionalText(body.evidenceNotes);
  const status = optionalStringEnum(body.status, itemStatuses);
  const dueDate = optionalDate(body.dueDate);
  const orderIndex = typeof body.orderIndex === "number" ? body.orderIndex : undefined;
  if (
    !title ||
    (body.notes !== undefined && notes === undefined) ||
    (body.evidenceNotes !== undefined && evidenceNotes === undefined) ||
    (body.dueDate !== undefined && dueDate === undefined)
  ) {
    return validationError("Invalid commitment item payload");
  }
  return { ok: true, value: { title, notes, evidenceNotes, status, dueDate, orderIndex } };
}

export function parseUpdateCommitmentItemRequest(
  body: unknown
): Result<UpdateCommitmentItemHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const title = body.title === undefined ? undefined : requiredText(body.title);
  const notes = optionalText(body.notes);
  const evidenceNotes = optionalText(body.evidenceNotes);
  const status = optionalStringEnum(body.status, itemStatuses);
  const dueDate = optionalDate(body.dueDate);
  const completedAt = optionalDateTime(body.completedAt);
  const orderIndex = typeof body.orderIndex === "number" ? body.orderIndex : undefined;
  if (
    title === null ||
    (body.notes !== undefined && notes === undefined) ||
    (body.evidenceNotes !== undefined && evidenceNotes === undefined) ||
    (body.dueDate !== undefined && dueDate === undefined) ||
    (body.completedAt !== undefined && completedAt === undefined)
  ) {
    return validationError("Invalid commitment item payload");
  }
  return { ok: true, value: { title, notes, evidenceNotes, status, dueDate, completedAt, orderIndex } };
}

export function parseCreateCommitmentOutcomeRequest(
  body: unknown
): Result<CreateCommitmentOutcomeHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const type = requiredStringEnum(body.type, outcomeTypes);
  const status = optionalStringEnum(body.status, outcomeStatuses);
  const title = requiredText(body.title);
  const description = optionalText(body.description);
  const amount = optionalNumber(body.amount);
  const currency = optionalText(body.currency);
  const decidedAt = optionalDateTime(body.decidedAt);
  if (
    !type ||
    !title ||
    (body.description !== undefined && description === undefined) ||
    (body.amount !== undefined && amount === undefined) ||
    (body.currency !== undefined && currency === undefined) ||
    (body.decidedAt !== undefined && decidedAt === undefined)
  ) {
    return validationError("Invalid commitment outcome payload");
  }
  return { ok: true, value: { type, status, title, description, amount, currency, decidedAt } };
}

export function parseUpdateCommitmentOutcomeRequest(
  body: unknown
): Result<UpdateCommitmentOutcomeHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const type = optionalStringEnum(body.type, outcomeTypes);
  const status = optionalStringEnum(body.status, outcomeStatuses);
  const title = body.title === undefined ? undefined : requiredText(body.title);
  const description = optionalText(body.description);
  const amount = optionalNumber(body.amount);
  const currency = optionalText(body.currency);
  const decidedAt = optionalDateTime(body.decidedAt);
  if (
    title === null ||
    (body.description !== undefined && description === undefined) ||
    (body.amount !== undefined && amount === undefined) ||
    (body.currency !== undefined && currency === undefined) ||
    (body.decidedAt !== undefined && decidedAt === undefined)
  ) {
    return validationError("Invalid commitment outcome payload");
  }
  return { ok: true, value: { type, status, title, description, amount, currency, decidedAt } };
}
