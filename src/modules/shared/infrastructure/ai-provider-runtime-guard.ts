import {
  AI_PROVIDER,
  type AIProvider,
} from "../domain/value-objects/ai-provider.value-object";
import { forbidden } from "./http/api-errors";

export function assertAIProviderAllowedForRuntime(provider: AIProvider): void {
  const runtime = process.env.NODE_ENV;

  if (runtime === "test" && provider !== AI_PROVIDER.MOCK) {
    throw forbidden("Los proveedores reales de IA están deshabilitados en tests.");
  }

  if (runtime === "production" && provider === AI_PROVIDER.MOCK) {
    throw forbidden("El proveedor mock de IA no está permitido en producción.");
  }
}
