import { generateOfferChatAnswer } from "@/lib/ai-offer-chat";
import type { Analysis, CVRecord } from "@/lib/analysis-types";
import type { OfferChatHistoryMessage } from "@/lib/ai-offer-chat-prompts";
import type {
  AnalysisChatAIInput,
  AnalysisChatAIService,
} from "../../domain/repositories/analysis-chat-ai-service.repository";

export class GeminiAnalysisChatAIService implements AnalysisChatAIService {
  async generateAnswer(input: AnalysisChatAIInput): Promise<string> {
    return generateOfferChatAnswer({
      apiKey: input.apiKey,
      model: input.model,
      message: input.message,
      analysis: input.context.analysis as Analysis,
      cv: input.context.cv as CVRecord | null,
      cvText: input.context.cvText,
      history: input.history.map((message) => ({
        role: message.role,
        content: message.content,
      })) satisfies OfferChatHistoryMessage[],
    });
  }
}
