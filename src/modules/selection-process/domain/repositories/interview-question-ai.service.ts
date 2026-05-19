import type { Analysis, CVRecord } from "@/lib/analysis-types";
import type { AIProvider } from "@/modules/shared";

export interface InterviewQuestionAIInput {
  question: string;
  context: string;
  currentAnswer?: string | null;
  instruction?: string | null;
  cv?: CVRecord | null;
  cvText?: string | null;
  analysis?: Analysis | null;
}

export interface InterviewQuestionAIService {
  generateAnswer(input: InterviewQuestionAIInput): Promise<string>;
  editAnswer(input: InterviewQuestionAIInput): Promise<string>;
}

export interface InterviewQuestionAIServiceFactory {
  create(config: {
    provider: AIProvider;
    apiKey?: string;
    model: string;
  }): InterviewQuestionAIService;
}
