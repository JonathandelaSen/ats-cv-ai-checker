import type { SupabaseClient } from "@supabase/supabase-js";
import { CreateCVAnalysisUseCase } from "./application/use-cases/create-cv-analysis.use-case";
import { DeleteCVAnalysisUseCase } from "./application/use-cases/delete-cv-analysis.use-case";
import { GetCVAnalysisByIdUseCase } from "./application/use-cases/get-cv-analysis-by-id.use-case";
import { ListCVAnalysesUseCase } from "./application/use-cases/list-cv-analyses.use-case";
import { ListCVAnalysisUsageByDocumentUseCase } from "./application/use-cases/list-cv-analysis-usage-by-document.use-case";
import { ScoreCVAnalysisUseCase } from "./application/use-cases/score-cv-analysis.use-case";
import { UpdateCVAnalysisAIResultUseCase } from "./application/use-cases/update-cv-analysis-ai-result.use-case";
import { GeminiCVScoringAIServiceFactory } from "./infrastructure/services/gemini-cv-scoring-ai.service";
import { SupabaseCVAnalysisRepository } from "./infrastructure/repositories/supabase-cv-analysis.repository";

const repo = new SupabaseCVAnalysisRepository();
const aiServiceFactory = new GeminiCVScoringAIServiceFactory();

function createUseCases() {
  return {
    createCVAnalysis: new CreateCVAnalysisUseCase({ repo }),
    listCVAnalyses: new ListCVAnalysesUseCase({ repo }),
    listCVAnalysisUsageByDocument: new ListCVAnalysisUsageByDocumentUseCase({
      repo,
    }),
    getCVAnalysisById: new GetCVAnalysisByIdUseCase({ repo }),
    scoreCVAnalysis: new ScoreCVAnalysisUseCase({ repo, aiServiceFactory }),
    updateCVAnalysisAIResult: new UpdateCVAnalysisAIResultUseCase({ repo }),
    deleteCVAnalysis: new DeleteCVAnalysisUseCase({ repo }),
  };
}

export type CVAnalysisModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): CVAnalysisModule;
};

export function createCVAnalysisModule(): CVAnalysisModule {
  const useCases = createUseCases();
  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      repo.bindRequest(client);
      return this;
    },
  };
}
