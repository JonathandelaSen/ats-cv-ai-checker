import type {
  AnalysisChatAIInput,
  AnalysisChatAIService,
} from "../../domain/repositories/analysis-chat-ai-service.repository";

class MockAnalysisChatAIService implements AnalysisChatAIService {
  async generateAnswer(input: AnalysisChatAIInput): Promise<string> {
    return `[mock-ai] Respuesta de chat para "${input.message}" con ${input.history.length} mensajes previos.`;
  }
}

export class MockAnalysisChatAIServiceFactory {
  create(): AnalysisChatAIService {
    return new MockAnalysisChatAIService();
  }
}
