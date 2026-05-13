import type { SupabaseClient } from "@supabase/supabase-js";
import { CreateCVAnalysisUseCase } from "./application/use-cases/create-cv-analysis.use-case";
import { DeleteCVAnalysisUseCase } from "./application/use-cases/delete-cv-analysis.use-case";
import { GetCVAnalysisByIdUseCase } from "./application/use-cases/get-cv-analysis-by-id.use-case";
import { ListCVAnalysesUseCase } from "./application/use-cases/list-cv-analyses.use-case";
import { UpdateCVAnalysisAIResultUseCase } from "./application/use-cases/update-cv-analysis-ai-result.use-case";
import { SupabaseCVAnalysisRepository } from "./infrastructure/repositories/supabase-cv-analysis.repository";

const repo = new SupabaseCVAnalysisRepository();

function createUseCases() {
  return {
    createCVAnalysis: new CreateCVAnalysisUseCase({ repo }),
    listCVAnalyses: new ListCVAnalysesUseCase({ repo }),
    getCVAnalysisById: new GetCVAnalysisByIdUseCase({ repo }),
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
