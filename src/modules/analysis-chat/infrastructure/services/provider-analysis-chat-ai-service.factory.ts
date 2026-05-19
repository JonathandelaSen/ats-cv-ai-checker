import {
  AI_PROVIDER,
  assertAIProviderAllowedForRuntime,
  badRequest,
} from "@/modules/shared";
import type {
  AnalysisChatAIService,
  AnalysisChatAIServiceFactory,
} from "../../domain/repositories/analysis-chat-ai-service.repository";
import type { GeminiAnalysisChatAIServiceFactory } from "./gemini-analysis-chat-ai.service";
import type { MockAnalysisChatAIServiceFactory } from "./mock-analysis-chat-ai.service";

export class ProviderAnalysisChatAIServiceFactory
  implements AnalysisChatAIServiceFactory
{
  constructor(
    private readonly deps: {
      geminiFactory: GeminiAnalysisChatAIServiceFactory;
      mockFactory: MockAnalysisChatAIServiceFactory;
    },
  ) {}

  create(
    config: Parameters<AnalysisChatAIServiceFactory["create"]>[0],
  ): AnalysisChatAIService {
    assertAIProviderAllowedForRuntime(config.provider);
    const factories = {
      [AI_PROVIDER.GEMINI]: () => this.deps.geminiFactory.create(config),
      [AI_PROVIDER.MOCK]: () => this.deps.mockFactory.create(),
    };
    const createService = factories[config.provider];
    if (!createService) throw badRequest("Proveedor de IA no soportado para el chat.");
    return createService();
  }
}
