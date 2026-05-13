import type { SupabaseClient } from "@supabase/supabase-js";
import { getBestCVText } from "@/lib/cv-profile";
import { getAnalysisFacade } from "@/lib/analysis-facade";
import type { SupabaseAware } from "@/modules/shared/infrastructure/supabase-aware";
import type { AnalysisChatContext } from "../../domain/repositories/analysis-chat-ai-service.repository";
import type { AnalysisChatContextReader } from "../../domain/repositories/analysis-chat-context.repository";

export class AnalysisChatContextRepository
  implements AnalysisChatContextReader, SupabaseAware
{
  private client!: SupabaseClient;

  bindRequest(client: SupabaseClient) {
    this.client = client;
  }

  async findByAnalysisId(input: {
    analysisId: string;
    userId: string;
  }): Promise<AnalysisChatContext | null> {
    const analysis = await getAnalysisFacade(
      this.client,
      input.analysisId,
      input.userId,
    );
    if (!analysis) return null;

    const { data: cv, error } = analysis.cv_id
      ? await this.client
          .from("cvs")
          .select("*")
          .eq("id", analysis.cv_id)
          .eq("user_id", input.userId)
          .maybeSingle()
      : { data: null, error: null };
    if (error) throw error;

    return {
      analysisId: analysis.id,
      cvId: analysis.cv_id,
      analysisMode: analysis.analysis_mode,
      analysis,
      cv,
      cvText: getBestCVText(analysis),
    };
  }
}
