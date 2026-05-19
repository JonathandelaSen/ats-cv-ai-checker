import {
  AI_PROVIDER,
  assertAIProviderAllowedForRuntime,
  badRequest,
} from "@/modules/shared";
import type {
  InterviewQuestionAIService,
  InterviewQuestionAIServiceFactory,
} from "../../domain/repositories/interview-question-ai.service";
import type { GeminiInterviewQuestionAIServiceFactory } from "./gemini-interview-question-ai.service";
import type { MockInterviewQuestionAIServiceFactory } from "./mock-interview-question-ai.service";

export class ProviderInterviewQuestionAIServiceFactory
  implements InterviewQuestionAIServiceFactory
{
  constructor(
    private readonly deps: {
      geminiFactory: GeminiInterviewQuestionAIServiceFactory;
      mockFactory: MockInterviewQuestionAIServiceFactory;
    },
  ) {}

  create(
    config: Parameters<InterviewQuestionAIServiceFactory["create"]>[0],
  ): InterviewQuestionAIService {
    assertAIProviderAllowedForRuntime(config.provider);
    const factories = {
      [AI_PROVIDER.GEMINI]: () => this.deps.geminiFactory.create(config),
      [AI_PROVIDER.MOCK]: () => this.deps.mockFactory.create(),
    };
    const createService = factories[config.provider];
    if (!createService) throw badRequest("Proveedor de IA no soportado para preguntas de entrevista.");
    return createService();
  }
}
