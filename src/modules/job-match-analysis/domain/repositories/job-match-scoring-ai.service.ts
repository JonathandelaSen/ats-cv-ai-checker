import type { AIProvider } from "@/modules/shared";

export interface JobMatchScoringAIResult {
  score: number;
  feedback: string;
  aiKeywords: string[];
  improvements: string[];
  jobKeyData: unknown | null;
  jobKeywords: string[];
  cvKeywords: string[];
  matchingKeywords: string[];
  missingKeywords: string[];
}

export interface JobMatchScoringAIInput {
  text: string;
  jobDescription: string;
  jobUrl?: string | null;
}

export interface JobMatchScoringAIService {
  score(input: JobMatchScoringAIInput): Promise<JobMatchScoringAIResult>;
}

export interface JobMatchScoringAIServiceFactory {
  create(config: {
    provider: AIProvider;
    apiKey?: string;
    model: string;
  }): JobMatchScoringAIService;
}
