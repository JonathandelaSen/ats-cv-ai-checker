import {
  AI_PROVIDER,
  assertAIProviderAllowedForRuntime,
  badRequest,
} from "@/modules/shared";
import type {
  FeedbackAIService,
  FeedbackAIServiceFactory,
} from "../../domain/repositories/feedback-ai-service.repository";
import type { GeminiFeedbackAIServiceFactory } from "./gemini-feedback-ai.service";
import type { MockFeedbackAIServiceFactory } from "./mock-feedback-ai.service";

export class ProviderFeedbackAIServiceFactory
  implements FeedbackAIServiceFactory
{
  constructor(
    private readonly deps: {
      geminiFactory: GeminiFeedbackAIServiceFactory;
      mockFactory: MockFeedbackAIServiceFactory;
    },
  ) {}

  create(
    config: Parameters<FeedbackAIServiceFactory["create"]>[0],
  ): FeedbackAIService {
    assertAIProviderAllowedForRuntime(config.provider);
    const factories = {
      [AI_PROVIDER.GEMINI]: () => this.deps.geminiFactory.create(config),
      [AI_PROVIDER.MOCK]: () => this.deps.mockFactory.create(),
    };
    const createService = factories[config.provider];
    if (!createService) throw badRequest("Proveedor de IA no soportado para feedback.");
    return createService();
  }
}
