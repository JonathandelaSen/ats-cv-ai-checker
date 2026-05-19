import { afterEach, describe, expect, it, vi } from "vitest";
import { assertAIProviderAllowedForRuntime } from "./ai-provider-runtime-guard";

describe("assertAIProviderAllowedForRuntime", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", originalNodeEnv);
    vi.unstubAllEnvs();
  });

  it("allows only mock in test runtime", () => {
    vi.stubEnv("NODE_ENV", "test");

    expect(() => assertAIProviderAllowedForRuntime("mock")).not.toThrow();
    expect(() => assertAIProviderAllowedForRuntime("gemini")).toThrow(
      "Los proveedores reales de IA están deshabilitados en tests.",
    );
  });

  it("allows mock and real providers in development runtime", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(() => assertAIProviderAllowedForRuntime("mock")).not.toThrow();
    expect(() => assertAIProviderAllowedForRuntime("gemini")).not.toThrow();
  });

  it("rejects mock in production runtime", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => assertAIProviderAllowedForRuntime("mock")).toThrow(
      "El proveedor mock de IA no está permitido en producción.",
    );
    expect(() => assertAIProviderAllowedForRuntime("gemini")).not.toThrow();
  });
});
