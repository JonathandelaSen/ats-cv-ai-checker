import type { ChatMessagePrimitives } from "../entities/chat-message.entity";
import type { AIProvider } from "@/modules/shared";

export interface AnalysisChatContext {
  analysisId: string;
  cvId: string | null;
  analysisMode: string;
  analysis: unknown;
  cv: unknown;
  cvText: string | null;
}

export interface AnalysisChatAIInput {
  message: string;
  context: AnalysisChatContext;
  history: ChatMessagePrimitives[];
}

export interface AnalysisChatAIService {
  generateAnswer(input: AnalysisChatAIInput): Promise<string>;
}

export interface AnalysisChatAIServiceFactory {
  create(config: {
    provider: AIProvider;
    apiKey?: string;
    model: string;
  }): AnalysisChatAIService;
}
