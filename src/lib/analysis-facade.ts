import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cvAnalysisModule,
  jobMatchAnalysisModule,
} from "@/lib/container";
import {
  presentCVAnalysis,
  presentCVAnalysisSummary,
} from "@/modules/cv-analysis";
import {
  presentJobMatchAnalysis,
  presentJobMatchAnalysisSummary,
} from "@/modules/job-match-analysis";

export async function listAnalysisFacade(
  supabase: SupabaseClient,
  userId: string
) {
  const [cvAnalyses, jobMatchAnalyses] = await Promise.all([
    cvAnalysisModule.bindRequest(supabase).listCVAnalyses.execute({ userId }),
    jobMatchAnalysisModule
      .bindRequest(supabase)
      .listJobMatchAnalyses.execute({ userId }),
  ]);

  return [
    ...cvAnalyses.map(presentCVAnalysisSummary),
    ...jobMatchAnalyses.map(presentJobMatchAnalysisSummary),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getAnalysisFacade(
  supabase: SupabaseClient,
  id: string,
  userId: string
) {
  const cvAnalysis = await cvAnalysisModule
    .bindRequest(supabase)
    .getCVAnalysisById.execute({ id, userId });
  if (cvAnalysis) return presentCVAnalysis(cvAnalysis);

  const jobMatchAnalysis = await jobMatchAnalysisModule
    .bindRequest(supabase)
    .getJobMatchAnalysisById.execute({ id, userId });
  if (jobMatchAnalysis) return presentJobMatchAnalysis(jobMatchAnalysis);

  return null;
}
