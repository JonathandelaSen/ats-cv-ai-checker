import type {
  JobMatchScoringAIInput,
  JobMatchScoringAIResult,
  JobMatchScoringAIService,
} from "../../domain/repositories/job-match-scoring-ai.service";

class MockJobMatchScoringAIService implements JobMatchScoringAIService {
  async score(input: JobMatchScoringAIInput): Promise<JobMatchScoringAIResult> {
    return {
      score: 74,
      feedback: `[mock-ai] Oferta comparada con ${input.text.length} caracteres de CV.`,
      aiKeywords: ["[mock-ai] match"],
      improvements: ["[mock-ai] Refuerza experiencia alineada con la oferta."],
      jobKeyData: {
        title: "[mock-ai] Role",
        company: null,
        location: null,
        remote: null,
        salary: null,
        seniority: null,
        contractType: null,
        benefits: [],
        requirements: [],
        responsibilities: [],
        notablePoints: [],
      },
      jobKeywords: ["[mock-ai] job"],
      cvKeywords: ["[mock-ai] cv"],
      matchingKeywords: ["[mock-ai] match"],
      missingKeywords: ["[mock-ai] missing"],
    };
  }
}

export class MockJobMatchScoringAIServiceFactory {
  create(): JobMatchScoringAIService {
    return new MockJobMatchScoringAIService();
  }
}
