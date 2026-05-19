import { badRequest } from "../../infrastructure/http/api-errors";

export const AI_PROVIDER = {
  GEMINI: "gemini",
  MOCK: "mock",
} as const;

export const AI_PROVIDERS = [AI_PROVIDER.GEMINI, AI_PROVIDER.MOCK] as const;

export type AIProvider = (typeof AI_PROVIDERS)[number];

export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === "string" && AI_PROVIDERS.includes(value as AIProvider);
}

export function parseAIProvider(value: unknown): AIProvider {
  if (isAIProvider(value)) return value;
  throw badRequest("Proveedor de IA no soportado.");
}
