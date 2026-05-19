import {
  AI_PROVIDER,
  assertAIProviderAllowedForRuntime,
  badRequest,
} from "@/modules/shared";
import type {
  CVScoringAIService,
  CVScoringAIServiceFactory,
} from "../../domain/repositories/cv-scoring-ai.service";
import type { GeminiCVScoringAIServiceFactory } from "./gemini-cv-scoring-ai.service";
import type { MockCVScoringAIServiceFactory } from "./mock-cv-scoring-ai.service";

export class ProviderCVScoringAIServiceFactory
  implements CVScoringAIServiceFactory
{
  constructor(
    private readonly deps: {
      geminiFactory: GeminiCVScoringAIServiceFactory;
      mockFactory: MockCVScoringAIServiceFactory;
    },
  ) {}

  create(
    config: Parameters<CVScoringAIServiceFactory["create"]>[0],
  ): CVScoringAIService {
    assertAIProviderAllowedForRuntime(config.provider);
    const factories = {
      [AI_PROVIDER.GEMINI]: () => this.deps.geminiFactory.create(config),
      [AI_PROVIDER.MOCK]: () => this.deps.mockFactory.create(),
    };
    const createService = factories[config.provider];
    if (!createService) throw badRequest("Proveedor de IA no soportado para analizar CVs.");
    return createService();
  }
}
