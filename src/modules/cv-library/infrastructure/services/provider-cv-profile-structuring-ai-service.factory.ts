import {
  AI_PROVIDER,
  assertAIProviderAllowedForRuntime,
  badRequest,
} from "@/modules/shared";
import type {
  CVProfileStructuringAIService,
  CVProfileStructuringAIServiceFactory,
} from "../../domain/repositories/cv-profile-ai.service";
import type { GeminiCVProfileStructuringAIServiceFactory } from "./gemini-cv-profile-structuring-ai.service";
import type { MockCVProfileStructuringAIServiceFactory } from "./mock-cv-profile-structuring-ai.service";

export class ProviderCVProfileStructuringAIServiceFactory
  implements CVProfileStructuringAIServiceFactory
{
  constructor(
    private readonly deps: {
      geminiFactory: GeminiCVProfileStructuringAIServiceFactory;
      mockFactory: MockCVProfileStructuringAIServiceFactory;
    },
  ) {}

  create(
    config: Parameters<CVProfileStructuringAIServiceFactory["create"]>[0],
  ): CVProfileStructuringAIService {
    assertAIProviderAllowedForRuntime(config.provider);
    const factories = {
      [AI_PROVIDER.GEMINI]: () => this.deps.geminiFactory.create(config),
      [AI_PROVIDER.MOCK]: () => this.deps.mockFactory.create(),
    };
    const createService = factories[config.provider];
    if (!createService) throw badRequest("Proveedor de IA no soportado para estructurar CVs.");
    return createService();
  }
}
