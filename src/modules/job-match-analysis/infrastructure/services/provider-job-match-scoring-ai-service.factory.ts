import {
  AI_PROVIDER,
  assertAIProviderAllowedForRuntime,
  badRequest,
} from "@/modules/shared";
import type {
  JobMatchScoringAIService,
  JobMatchScoringAIServiceFactory,
} from "../../domain/repositories/job-match-scoring-ai.service";
import type { GeminiJobMatchScoringAIServiceFactory } from "./gemini-job-match-scoring-ai.service";
import type { MockJobMatchScoringAIServiceFactory } from "./mock-job-match-scoring-ai.service";

export class ProviderJobMatchScoringAIServiceFactory
  implements JobMatchScoringAIServiceFactory
{
  constructor(
    private readonly deps: {
      geminiFactory: GeminiJobMatchScoringAIServiceFactory;
      mockFactory: MockJobMatchScoringAIServiceFactory;
    },
  ) {}

  create(
    config: Parameters<JobMatchScoringAIServiceFactory["create"]>[0],
  ): JobMatchScoringAIService {
    assertAIProviderAllowedForRuntime(config.provider);
    const factories = {
      [AI_PROVIDER.GEMINI]: () => this.deps.geminiFactory.create(config),
      [AI_PROVIDER.MOCK]: () => this.deps.mockFactory.create(),
    };
    const createService = factories[config.provider];
    if (!createService) throw badRequest("Proveedor de IA no soportado para analizar ofertas.");
    return createService();
  }
}
