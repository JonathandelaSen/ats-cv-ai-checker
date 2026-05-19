import { parseAIRequestConfig, type AIRequestConfig } from "@/app/api/_shared/ai-request";

type Result<TValue, TError> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

export interface HttpValidationError {
  message: string;
  status: 400;
}

export type OfferChatPostInput =
  | { action: "create_conversation"; title: string }
  | { action: "rename_conversation"; conversationId: string; title: string }
  | { action: "delete_conversation"; conversationId: string }
  | ({
      action: "message";
      conversationId: string;
      message: string;
    } & AIRequestConfig);

function validationError(message: string): Result<never, HttpValidationError> {
  return { ok: false, error: { message, status: 400 } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseListOfferChatRequest(params: URLSearchParams) {
  return { ok: true, value: { conversationId: params.get("conversationId") } } as const;
}

export function parseOfferChatPostRequest(
  body: unknown
): Result<OfferChatPostInput, HttpValidationError> {
  if (!isRecord(body)) return validationError("Request body must be a JSON object");
  const action = typeof body.action === "string" ? body.action : "message";

  if (action === "create_conversation") {
    return { ok: true, value: { action, title: text(body.title) ?? "Nueva conversación" } };
  }

  if (action === "rename_conversation") {
    const conversationId = text(body.conversationId);
    const title = text(body.title);
    if (!conversationId || !title) return validationError("conversationId and title are required");
    return { ok: true, value: { action, conversationId, title } };
  }

  if (action === "delete_conversation") {
    const conversationId = text(body.conversationId);
    if (!conversationId) return validationError("conversationId is required");
    return { ok: true, value: { action, conversationId } };
  }

  const message = text(body.message);
  const ai = parseAIRequestConfig(body);
  const conversationId = text(body.conversationId);
  if (!message) return validationError("Message is required");
  if (!ai.ok) return validationError(ai.message);
  if (!conversationId) return validationError("conversationId is required");
  return { ok: true, value: { action: "message", conversationId, message, ...ai.value } };
}
