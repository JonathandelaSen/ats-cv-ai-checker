import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderAnalysisChatAIServiceFactory } from "@/modules/analysis-chat/infrastructure/services/provider-analysis-chat-ai-service.factory";
import { ProviderCVScoringAIServiceFactory } from "@/modules/cv-analysis/infrastructure/services/provider-cv-scoring-ai-service.factory";
import { ProviderCVProfileEditingAIServiceFactory } from "@/modules/cv-library/infrastructure/services/provider-cv-profile-editing-ai-service.factory";
import { ProviderCVProfileStructuringAIServiceFactory } from "@/modules/cv-library/infrastructure/services/provider-cv-profile-structuring-ai-service.factory";
import { ProviderFeedbackAIServiceFactory } from "@/modules/feedback-notes/infrastructure/services/provider-feedback-ai-service.factory";
import { ProviderJobMatchScoringAIServiceFactory } from "@/modules/job-match-analysis/infrastructure/services/provider-job-match-scoring-ai-service.factory";
import { ProviderInterviewQuestionAIServiceFactory } from "@/modules/selection-process/infrastructure/services/provider-interview-question-ai-service.factory";
import { ProviderJournalAIServiceFactory } from "@/modules/work-journal/infrastructure/services/provider-journal-ai-service.factory";

function createDeps() {
  return {
    geminiService: { provider: "gemini" },
    mockService: { provider: "mock" },
    geminiFactory: { create: vi.fn(() => ({ provider: "gemini" })) },
    mockFactory: { create: vi.fn(() => ({ provider: "mock" })) },
  };
}

const factories = [
  ["analysis chat", ProviderAnalysisChatAIServiceFactory],
  ["CV scoring", ProviderCVScoringAIServiceFactory],
  ["CV profile editing", ProviderCVProfileEditingAIServiceFactory],
  ["CV profile structuring", ProviderCVProfileStructuringAIServiceFactory],
  ["feedback", ProviderFeedbackAIServiceFactory],
  ["job match scoring", ProviderJobMatchScoringAIServiceFactory],
  ["interview question", ProviderInterviewQuestionAIServiceFactory],
  ["journal", ProviderJournalAIServiceFactory],
] as const;

describe("provider-aware AI service factories", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(factories)("selects Gemini for %s outside test runtime", (_, Factory) => {
    vi.stubEnv("NODE_ENV", "development");
    const deps = createDeps();
    const factory = new Factory(deps as never);

    const service = factory.create({
      provider: "gemini",
      apiKey: "key",
      model: "gemini-test",
    });

    expect(service).toEqual({ provider: "gemini" });
    expect(deps.geminiFactory.create).toHaveBeenCalledWith({
      provider: "gemini",
      apiKey: "key",
      model: "gemini-test",
    });
  });

  it.each(factories)("selects mock for %s in test runtime", (_, Factory) => {
    vi.stubEnv("NODE_ENV", "test");
    const deps = createDeps();
    const factory = new Factory(deps as never);

    expect(factory.create({ provider: "mock", model: "mock-model" })).toEqual({
      provider: "mock",
    });
    expect(deps.mockFactory.create).toHaveBeenCalledOnce();
  });

  it.each(factories)("rejects Gemini for %s in test runtime", (_, Factory) => {
    vi.stubEnv("NODE_ENV", "test");
    const factory = new Factory(createDeps() as never);

    expect(() =>
      factory.create({ provider: "gemini", apiKey: "key", model: "gemini-test" }),
    ).toThrow("Los proveedores reales de IA están deshabilitados en tests.");
  });

  it.each(factories)("rejects mock for %s in production runtime", (_, Factory) => {
    vi.stubEnv("NODE_ENV", "production");
    const factory = new Factory(createDeps() as never);

    expect(() => factory.create({ provider: "mock", model: "mock-model" })).toThrow(
      "El proveedor mock de IA no está permitido en producción.",
    );
  });
});
