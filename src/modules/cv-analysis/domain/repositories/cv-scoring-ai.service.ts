import type { AIProvider } from "@/modules/shared";

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
  create(config: {
    provider: AIProvider;
    apiKey?: string;
    model: string;
  }): CVScoringAIService;
}
