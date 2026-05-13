import type { AnalysisChatContext } from "../../domain/repositories/analysis-chat-ai-service.repository";
import type { LegacyAnalysisChatContextReader } from "../../domain/repositories/legacy-analysis-chat-context.repository";

export class GetLegacyAnalysisChatContextUseCase {
  constructor(
    private readonly deps: { contextReader: LegacyAnalysisChatContextReader }
  ) {}

  async execute(input: {
    analysisId: string;
    userId: string;
  }): Promise<AnalysisChatContext | null> {
    return this.deps.contextReader.findByAnalysisId(input);
  }
}
