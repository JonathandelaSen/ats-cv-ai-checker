import {
  AI_PROVIDER,
  assertAIProviderAllowedForRuntime,
  badRequest,
} from "@/modules/shared";
import type {
  JournalAIService,
  JournalAIServiceFactory,
} from "../../domain/repositories/journal-ai-service.repository";
import type { GeminiJournalAIServiceFactory } from "./gemini-journal-ai.service";
import type { MockJournalAIServiceFactory } from "./mock-journal-ai.service";

export class ProviderJournalAIServiceFactory implements JournalAIServiceFactory {
  constructor(
    private readonly deps: {
      geminiFactory: GeminiJournalAIServiceFactory;
      mockFactory: MockJournalAIServiceFactory;
    },
  ) {}

  create(
    config: Parameters<JournalAIServiceFactory["create"]>[0],
  ): JournalAIService {
    assertAIProviderAllowedForRuntime(config.provider);
    const factories = {
      [AI_PROVIDER.GEMINI]: () => this.deps.geminiFactory.create(config),
      [AI_PROVIDER.MOCK]: () => this.deps.mockFactory.create(),
    };
    const createService = factories[config.provider];
    if (!createService) throw badRequest("Proveedor de IA no soportado para diario de trabajo.");
    return createService();
  }
}
