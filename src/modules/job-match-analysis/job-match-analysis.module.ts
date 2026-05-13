import type { SupabaseClient } from "@supabase/supabase-js";
import { CreateJobMatchAnalysisUseCase } from "./application/use-cases/create-job-match-analysis.use-case";
import { DeleteJobMatchAnalysisUseCase } from "./application/use-cases/delete-job-match-analysis.use-case";
import { GetJobMatchAnalysisByIdUseCase } from "./application/use-cases/get-job-match-analysis-by-id.use-case";
import { ListJobMatchAnalysesUseCase } from "./application/use-cases/list-job-match-analyses.use-case";
import { UpdateJobMatchAnalysisAIResultUseCase } from "./application/use-cases/update-job-match-analysis-ai-result.use-case";
import { UpdateJobMatchAnalysisJobUrlUseCase } from "./application/use-cases/update-job-match-analysis-job-url.use-case";
import { SupabaseJobMatchAnalysisRepository } from "./infrastructure/repositories/supabase-job-match-analysis.repository";

const repo = new SupabaseJobMatchAnalysisRepository();

function createUseCases() {
  return {
    createJobMatchAnalysis: new CreateJobMatchAnalysisUseCase({ repo }),
    listJobMatchAnalyses: new ListJobMatchAnalysesUseCase({ repo }),
    getJobMatchAnalysisById: new GetJobMatchAnalysisByIdUseCase({ repo }),
    updateJobMatchAnalysisAIResult: new UpdateJobMatchAnalysisAIResultUseCase({
      repo,
    }),
    updateJobMatchAnalysisJobUrl: new UpdateJobMatchAnalysisJobUrlUseCase({
      repo,
    }),
    deleteJobMatchAnalysis: new DeleteJobMatchAnalysisUseCase({ repo }),
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
