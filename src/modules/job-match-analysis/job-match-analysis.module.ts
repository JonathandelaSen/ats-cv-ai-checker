import type { SupabaseClient } from "@supabase/supabase-js";
import { GetJobMatchAnalysisByIdUseCase } from "./application/use-cases/get-job-match-analysis-by-id.use-case";
import { ListJobMatchAnalysesUseCase } from "./application/use-cases/list-job-match-analyses.use-case";
import { SupabaseJobMatchAnalysisRepository } from "./infrastructure/repositories/supabase-job-match-analysis.repository";

const repo = new SupabaseJobMatchAnalysisRepository();

function createUseCases() {
  return {
    listJobMatchAnalyses: new ListJobMatchAnalysesUseCase({ repo }),
    getJobMatchAnalysisById: new GetJobMatchAnalysisByIdUseCase({ repo }),
  };
}

export type JobMatchAnalysisModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): JobMatchAnalysisModule;
};

export function createJobMatchAnalysisModule(): JobMatchAnalysisModule {
  const useCases = createUseCases();
  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      repo.bindRequest(client);
      return this;
    },
  };
}
