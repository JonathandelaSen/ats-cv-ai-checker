type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

export interface CreateReceivedFeedbackHttpInput {
  activityContextId: string;
  receivedDate: string;
  giverName: string;
  feedbackText: string;
  userNote: string | null;
}

export interface UpdateReceivedFeedbackHttpInput {
  activityContextId?: string;
  receivedDate?: string;
  giverName?: string;
  feedbackText?: string;
  userNote?: string | null;
}

const GIVER_NAME_MAX_LENGTH = 120;
const FEEDBACK_TEXT_MAX_LENGTH = 10000;
const USER_NOTE_MAX_LENGTH = 10000;

function validationError(message: string): Result<never, HttpValidationError> {
  return { ok: false, error: { message, status: 400 } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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

function normalizeRequiredDate(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return isCalendarDate(trimmed) ? trimmed : null;
}

function parseReceivedDate(value: unknown) {
  const receivedDate = normalizeRequiredDate(value);
  if (!receivedDate) return validationError("Received date must use YYYY-MM-DD format");
  if (receivedDate > todayDateString()) {
    return validationError("Received date cannot be in the future");
  }
  return { ok: true, value: receivedDate } as const;
}

function parseGiverName(value: unknown) {
  const giverName = normalizeRequiredText(value);
  if (!giverName) return validationError("Giver name is required");
  if (giverName.length > GIVER_NAME_MAX_LENGTH) {
    return validationError(`Giver name must be ${GIVER_NAME_MAX_LENGTH} characters or fewer`);
  }
  return { ok: true, value: giverName } as const;
}

function parseFeedbackText(value: unknown) {
  const feedbackText = normalizeRequiredText(value);
  if (!feedbackText) return validationError("Feedback text is required");
  if (feedbackText.length > FEEDBACK_TEXT_MAX_LENGTH) {
    return validationError(`Feedback text must be ${FEEDBACK_TEXT_MAX_LENGTH} characters or fewer`);
  }
  return { ok: true, value: feedbackText } as const;
}

function parseUserNote(value: unknown) {
  const userNote = normalizeOptionalText(value);
  if (userNote === undefined) return validationError("Private note must be text or null");
  if ((userNote?.length ?? 0) > USER_NOTE_MAX_LENGTH) {
    return validationError(`Private note must be ${USER_NOTE_MAX_LENGTH} characters or fewer`);
  }
  return { ok: true, value: userNote } as const;
}

export function parseCreateReceivedFeedbackRequest(
  body: unknown
): Result<CreateReceivedFeedbackHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const receivedDate = parseReceivedDate(body.receivedDate);
  if (!receivedDate.ok) return receivedDate;

  const giverName = parseGiverName(body.giverName);
  if (!giverName.ok) return giverName;

  const feedbackText = parseFeedbackText(body.feedbackText);
  if (!feedbackText.ok) return feedbackText;

  const userNote =
    body.userNote === undefined ? ({ ok: true, value: null } as const) : parseUserNote(body.userNote);
  if (!userNote.ok) return userNote;

  const activityContextId = normalizeRequiredText(body.activityContextId);
  if (!activityContextId) {
    return validationError("Activity context is required");
  }

  return {
    ok: true,
    value: {
      activityContextId,
      receivedDate: receivedDate.value,
      giverName: giverName.value,
      feedbackText: feedbackText.value,
      userNote: userNote.value,
    },
  };
}

export function parseUpdateReceivedFeedbackRequest(
  body: unknown
): Result<UpdateReceivedFeedbackHttpInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");

  const updates: UpdateReceivedFeedbackHttpInput = {};

  if (body.activityContextId !== undefined) {
    const activityContextId = normalizeRequiredText(body.activityContextId);
    if (!activityContextId) return validationError("Activity context is required");
    updates.activityContextId = activityContextId;
  }

  if (body.receivedDate !== undefined) {
    const receivedDate = parseReceivedDate(body.receivedDate);
    if (!receivedDate.ok) return receivedDate;
    updates.receivedDate = receivedDate.value;
  }

  if (body.giverName !== undefined) {
    const giverName = parseGiverName(body.giverName);
    if (!giverName.ok) return giverName;
    updates.giverName = giverName.value;
  }

  if (body.feedbackText !== undefined) {
    const feedbackText = parseFeedbackText(body.feedbackText);
    if (!feedbackText.ok) return feedbackText;
    updates.feedbackText = feedbackText.value;
  }

  if (body.userNote !== undefined) {
    const userNote = parseUserNote(body.userNote);
    if (!userNote.ok) return userNote;
    updates.userNote = userNote.value;
  }

  return { ok: true, value: updates };
}
