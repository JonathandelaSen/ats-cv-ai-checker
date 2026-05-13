import type { SupabaseClient } from "@supabase/supabase-js";
import { getBestCVText } from "@/lib/cv-profile";
import { getAnalysis } from "@/lib/db";
import type { SupabaseAware } from "@/modules/shared/infrastructure/supabase-aware";
import type { AnalysisChatContext } from "../../domain/repositories/analysis-chat-ai-service.repository";
import type { LegacyAnalysisChatContextReader } from "../../domain/repositories/legacy-analysis-chat-context.repository";

export class LegacyAnalysisChatContextRepository
  implements LegacyAnalysisChatContextReader, SupabaseAware
{
  private client!: SupabaseClient;

  bindRequest(client: SupabaseClient) {
    this.client = client;
  }

  async findByAnalysisId(input: {
    analysisId: string;
    userId: string;
  }): Promise<AnalysisChatContext | null> {
    const analysis = await getAnalysis(
      this.client,
      input.analysisId,
      input.userId
    );
    if (!analysis) return null;
    return {
      analysisId: analysis.id,
      cvId: analysis.cv_id,
      analysisMode: analysis.analysis_mode,
      analysis,
      cv: analysis.cv ?? null,
      cvText: getBestCVText(analysis),
    };
  }
}
