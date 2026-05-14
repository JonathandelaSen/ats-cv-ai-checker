import type { Analysis, CVRecord } from "@/lib/analysis-types";

export interface InterviewQuestionAIInput {
  apiKey: string;
  model: string;
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
