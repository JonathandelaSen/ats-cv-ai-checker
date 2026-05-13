import type { AnalysisChatContext } from "./analysis-chat-ai-service.repository";

export interface LegacyAnalysisChatContextReader {
  findByAnalysisId(input: {
    analysisId: string;
    userId: string;
  }): Promise<AnalysisChatContext | null>;
}
