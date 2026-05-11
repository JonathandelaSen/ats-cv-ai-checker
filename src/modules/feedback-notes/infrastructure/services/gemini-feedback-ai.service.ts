import { generateFeedbackNotesFinalFeedback } from "@/lib/ai-feedback-notes";
import type {
  FeedbackAIService,
  GenerateFinalFeedbackInput,
} from "../../domain/repositories/feedback-ai-service.repository";

export class GeminiFeedbackAIService implements FeedbackAIService {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  generateFinalFeedback(input: GenerateFinalFeedbackInput): Promise<string> {
    return generateFeedbackNotesFinalFeedback({
      apiKey: this.config.apiKey,
      model: this.config.model,
      personName: input.personName,
      entries: input.entries,
    });
  }
}
