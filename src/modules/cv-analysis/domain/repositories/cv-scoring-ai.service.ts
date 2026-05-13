export interface CVScoringAIResult {
  score: number;
  feedback: string;
  keywords: string[];
  improvements: string[];
}

export interface CVScoringAIInput {
  text: string;
  additionalContext?: string | null;
}

export interface CVScoringAIService {
  score(input: CVScoringAIInput): Promise<CVScoringAIResult>;
}

export interface CVScoringAIServiceFactory {
  create(config: { apiKey: string; model: string }): CVScoringAIService;
}
