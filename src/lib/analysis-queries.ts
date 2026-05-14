import type { SupabaseClient } from "@supabase/supabase-js";
import type { CVRecommendationAnalysis } from "@/lib/analysis-types";
import {
  cvAnalysisModule,
  jobMatchAnalysisModule,
} from "@/lib/container";
import { presentCVAnalysis } from "@/modules/cv-analysis";
import { presentJobMatchAnalysis } from "@/modules/job-match-analysis";

export async function getLatestRecommendationAnalysisForCV(
  supabase: SupabaseClient,
  cvId: string,
  userId: string,
): Promise<CVRecommendationAnalysis | null> {
  const [cvAnalyses, jobMatchAnalyses] = await Promise.all([
    cvAnalysisModule.bindRequest(supabase).listCVAnalyses.execute({ userId }),
    jobMatchAnalysisModule
      .bindRequest(supabase)
      .listJobMatchAnalyses.execute({ userId }),
  ]);

  const recommendations = [
    ...cvAnalyses.map(presentCVAnalysis),
    ...jobMatchAnalyses.map(presentJobMatchAnalysis),
  ]
    .filter(
      (analysis) =>
        analysis.cv_id === cvId && typeof analysis.ai_score === "number",
    )
    .sort((a, b) => {
      const aDate = a.ai_analyzed_at ?? a.created_at;
      const bDate = b.ai_analyzed_at ?? b.created_at;
      return bDate.localeCompare(aDate);
    });

  const latest = recommendations[0];
  return latest
    ? {
        id: latest.id,
        cv_id: latest.cv_id,
        title: latest.title,
        filename: latest.filename,
        created_at: latest.created_at,
        analysis_mode: latest.analysis_mode,
        ai_score: latest.ai_score,
        ai_analyzed_at: latest.ai_analyzed_at,
        job_url: latest.job_url,
        offer_status: latest.offer_status,
        offer_next_action_at: latest.offer_next_action_at,
        ai_improvements: latest.ai_improvements,
        missing_keywords: latest.missing_keywords,
        ai_keywords: latest.ai_keywords,
      }
    : null;
}
