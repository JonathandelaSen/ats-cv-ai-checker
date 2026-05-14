import type { SupabaseClient } from "@supabase/supabase-js";
import type { Analysis } from "@/lib/analysis-types";
import { getBestCVText } from "@/lib/cv-profile";
import type { QueryBus } from "@/modules/shared";
import type { SupabaseAware } from "@/modules/shared/infrastructure/supabase-aware";
import { GetCVAnalysisByIdQuery } from "@/modules/cv-analysis";
import { GetJobMatchAnalysisByIdQuery } from "@/modules/job-match-analysis";
import type { AnalysisChatContext } from "../../domain/repositories/analysis-chat-ai-service.repository";
import type { AnalysisChatContextReader } from "../../domain/repositories/analysis-chat-context.repository";

export class AnalysisChatContextRepository
  implements AnalysisChatContextReader, SupabaseAware
{
  private client!: SupabaseClient;

  constructor(private readonly queryBus: QueryBus) {}

  bindRequest(client: SupabaseClient) {
    this.client = client;
  }

  async findByAnalysisId(input: {
    analysisId: string;
    userId: string;
  }): Promise<AnalysisChatContext | null> {
    const analysis = await this.getAnalysis(input.analysisId, input.userId);
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

  private async getAnalysis(
    id: string,
    userId: string,
  ): Promise<Analysis | null> {
    const cvAnalysis = await this.queryBus.execute<Analysis | null>(
      new GetCVAnalysisByIdQuery({ id, userId }),
    );
    if (cvAnalysis) return cvAnalysis;

    const jobMatchAnalysis = await this.queryBus.execute<Analysis | null>(
      new GetJobMatchAnalysisByIdQuery({ id, userId }),
    );
    if (jobMatchAnalysis) return jobMatchAnalysis;

    return null;
  }
}
