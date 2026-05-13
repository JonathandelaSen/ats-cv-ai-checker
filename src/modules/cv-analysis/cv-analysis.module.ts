import type { SupabaseClient } from "@supabase/supabase-js";
import { GetCVAnalysisByIdUseCase } from "./application/use-cases/get-cv-analysis-by-id.use-case";
import { ListCVAnalysesUseCase } from "./application/use-cases/list-cv-analyses.use-case";
import { SupabaseCVAnalysisRepository } from "./infrastructure/repositories/supabase-cv-analysis.repository";

const repo = new SupabaseCVAnalysisRepository();

function createUseCases() {
  return {
    listCVAnalyses: new ListCVAnalysesUseCase({ repo }),
    getCVAnalysisById: new GetCVAnalysisByIdUseCase({ repo }),
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
