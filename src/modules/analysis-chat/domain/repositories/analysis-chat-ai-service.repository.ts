import type { ChatMessagePrimitives } from "../entities/chat-message.entity";

export interface AnalysisChatContext {
  analysisId: string;
  cvId: string | null;
  analysisMode: string;
  analysis: unknown;
  cv: unknown;
  cvText: string | null;
}

export interface AnalysisChatAIInput {
  apiKey: string;
  model: string;
  message: string;
  context: AnalysisChatContext;
  history: ChatMessagePrimitives[];
}

export interface AnalysisChatAIService {
  generateAnswer(input: AnalysisChatAIInput): Promise<string>;
}
