import type {
  CVScoringAIInput,
  CVScoringAIResult,
  CVScoringAIService,
} from "../../domain/repositories/cv-scoring-ai.service";

class MockCVScoringAIService implements CVScoringAIService {
  async score(input: CVScoringAIInput): Promise<CVScoringAIResult> {
    return {
      score: 77,
      feedback: `[mock-ai] CV evaluado con ${input.text.length} caracteres.`,
      keywords: ["[mock-ai] cv", "typescript"],
      improvements: ["[mock-ai] Añade resultados medibles."],
    };
  }
}

export class MockCVScoringAIServiceFactory {
  create(): CVScoringAIService {
    return new MockCVScoringAIService();
  }
}
