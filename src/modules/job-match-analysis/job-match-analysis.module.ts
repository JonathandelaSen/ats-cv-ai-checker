import type { SupabaseClient } from "@supabase/supabase-js";
import { CreateJobMatchAnalysisUseCase } from "./application/use-cases/create-job-match-analysis.use-case";
import { DeleteJobMatchAnalysisUseCase } from "./application/use-cases/delete-job-match-analysis.use-case";
import { GetJobMatchAnalysisByIdUseCase } from "./application/use-cases/get-job-match-analysis-by-id.use-case";
import { ListJobMatchAnalysesUseCase } from "./application/use-cases/list-job-match-analyses.use-case";
import { ListJobMatchAnalysisUsageByDocumentUseCase } from "./application/use-cases/list-job-match-analysis-usage-by-document.use-case";
import { ScoreJobMatchAnalysisUseCase } from "./application/use-cases/score-job-match-analysis.use-case";
import { UpdateJobMatchAnalysisAIResultUseCase } from "./application/use-cases/update-job-match-analysis-ai-result.use-case";
import { UpdateJobMatchAnalysisJobUrlUseCase } from "./application/use-cases/update-job-match-analysis-job-url.use-case";
import { GeminiJobMatchScoringAIServiceFactory } from "./infrastructure/services/gemini-job-match-scoring-ai.service";
import { MockJobMatchScoringAIServiceFactory } from "./infrastructure/services/mock-job-match-scoring-ai.service";
import { ProviderJobMatchScoringAIServiceFactory } from "./infrastructure/services/provider-job-match-scoring-ai-service.factory";
import { SupabaseJobMatchAnalysisRepository } from "./infrastructure/repositories/supabase-job-match-analysis.repository";

const repo = new SupabaseJobMatchAnalysisRepository();
const aiServiceFactory = new ProviderJobMatchScoringAIServiceFactory({
  geminiFactory: new GeminiJobMatchScoringAIServiceFactory(),
  mockFactory: new MockJobMatchScoringAIServiceFactory(),
});

function createUseCases() {
  return {
    createJobMatchAnalysis: new CreateJobMatchAnalysisUseCase({ repo }),
    listJobMatchAnalyses: new ListJobMatchAnalysesUseCase({ repo }),
    listJobMatchAnalysisUsageByDocument:
      new ListJobMatchAnalysisUsageByDocumentUseCase({ repo }),
    getJobMatchAnalysisById: new GetJobMatchAnalysisByIdUseCase({ repo }),
    scoreJobMatchAnalysis: new ScoreJobMatchAnalysisUseCase({
      repo,
      aiServiceFactory,
    }),
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
