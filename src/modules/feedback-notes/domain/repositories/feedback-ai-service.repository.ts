import type { FeedbackEntryPrimitives } from "../entities/feedback-entry.entity";

export interface GenerateFinalFeedbackInput {
  personName: string;
  entries: Pick<FeedbackEntryPrimitives, "content" | "created_at">[];
}

export interface FeedbackAIService {
  generateFinalFeedback(input: GenerateFinalFeedbackInput): Promise<string>;
}
