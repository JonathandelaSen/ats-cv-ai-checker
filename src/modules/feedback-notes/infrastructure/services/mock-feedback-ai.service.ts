import type {
  FeedbackAIService,
  GenerateFinalFeedbackInput,
} from "../../domain/repositories/feedback-ai-service.repository";

class MockFeedbackAIService implements FeedbackAIService {
  async generateFinalFeedback(input: GenerateFinalFeedbackInput): Promise<string> {
    return `[mock-ai] Feedback final para ${input.personName} basado en ${input.entries.length} notas.`;
  }
}

export class MockFeedbackAIServiceFactory {
  create(): FeedbackAIService {
    return new MockFeedbackAIService();
  }
}
