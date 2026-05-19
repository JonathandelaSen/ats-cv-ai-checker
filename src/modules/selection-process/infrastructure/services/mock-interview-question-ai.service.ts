import type {
  InterviewQuestionAIInput,
  InterviewQuestionAIService,
} from "../../domain/repositories/interview-question-ai.service";

class MockInterviewQuestionAIService implements InterviewQuestionAIService {
  async generateAnswer(input: InterviewQuestionAIInput): Promise<string> {
    return `[mock-ai] Respuesta generada para: ${input.question}`;
  }

  async editAnswer(input: InterviewQuestionAIInput): Promise<string> {
    return `[mock-ai] Respuesta editada: ${input.instruction ?? input.question}`;
  }
}

export class MockInterviewQuestionAIServiceFactory {
  create(): InterviewQuestionAIService {
    return new MockInterviewQuestionAIService();
  }
}
