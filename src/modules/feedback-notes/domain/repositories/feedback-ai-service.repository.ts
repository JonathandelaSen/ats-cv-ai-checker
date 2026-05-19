import type { FeedbackEntryPrimitives } from "../entities/feedback-entry.entity";
import type { AIProvider } from "@/modules/shared";

export interface GenerateFinalFeedbackInput {
  personName: string;
  entries: Pick<FeedbackEntryPrimitives, "content" | "created_at">[];
}

export interface FeedbackAIService {
  generateFinalFeedback(input: GenerateFinalFeedbackInput): Promise<string>;
}

export interface FeedbackAIServiceFactory {
  create(config: {
    provider: AIProvider;
    apiKey?: string;
    model: string;
  }): FeedbackAIService;
}
