import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryBus } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseEventTracker } from "@/modules/shared";
import { CreateUploadedCVDocumentUseCase } from "./application/use-cases/create-uploaded-cv-document.use-case";
import { GetCVDocumentUseCase } from "./application/use-cases/get-cv-document.use-case";
import { ListCVDocumentsUseCase } from "./application/use-cases/list-cv-documents.use-case";
import { PrepareCVAnalysisInputUseCase } from "./application/use-cases/prepare-cv-analysis-input.use-case";
import { StructureCVProfileWithAIUseCase } from "./application/use-cases/structure-cv-profile-with-ai.use-case";
import { UpdateCVDocumentExtractionUseCase } from "./application/use-cases/update-cv-document-extraction.use-case";
import { UpsertCVStructuredProfileUseCase } from "./application/use-cases/upsert-cv-structured-profile.use-case";
import { SupabaseCVDocumentRepository } from "./infrastructure/repositories/supabase-cv-document.repository";
import { SupabaseCVStructuredProfileRepository } from "./infrastructure/repositories/supabase-cv-structured-profile.repository";
import { MockPdfTextExtractor } from "./infrastructure/services/mock-pdf-text-extractor.service";
import { MockCVProfileStructuringAIServiceFactory } from "./infrastructure/services/mock-cv-profile-structuring-ai.service";
import { ProviderCVProfileStructuringAIServiceFactory } from "./infrastructure/services/provider-cv-profile-structuring-ai-service.factory";
import { SupabaseCVPdfStorage } from "./infrastructure/services/supabase-cv-pdf-storage.service";
import { TemplateCVPdfRenderer } from "./infrastructure/services/template-cv-pdf-renderer.service";

const documentRepo = new SupabaseCVDocumentRepository();
const profileRepo = new SupabaseCVStructuredProfileRepository();
const pdfStorage = new SupabaseCVPdfStorage();
const mockTextExtractor = new MockPdfTextExtractor();
const templateRenderer = new TemplateCVPdfRenderer();
const profileStructuringAI = new ProviderCVProfileStructuringAIServiceFactory({
  geminiFactory: new MockCVProfileStructuringAIServiceFactory(),
  mockFactory: new MockCVProfileStructuringAIServiceFactory(),
});
const tracker: EventTracker = new SupabaseEventTracker();

function createE2EUseCases(queryBus: QueryBus) {
  return {
    listCVDocuments: new ListCVDocumentsUseCase({ documentRepo }),
    getCVDocument: new GetCVDocumentUseCase({ documentRepo }),
    createUploadedCVDocument: new CreateUploadedCVDocumentUseCase({
      documentRepo,
      tracker,
    }),
    updateCVDocumentExtraction: new UpdateCVDocumentExtractionUseCase({
      documentRepo,
      tracker,
    }),
    prepareCVAnalysisInput: new PrepareCVAnalysisInputUseCase({
      documentRepo,
      pdfStorage,
      textExtractor: mockTextExtractor,
      templateRenderer,
      tracker,
    }),
    structureCVProfileWithAI: new StructureCVProfileWithAIUseCase({
      aiFactory: profileStructuringAI,
    }),
    upsertCVStructuredProfile: new UpsertCVStructuredProfileUseCase({
      profileRepo,
      tracker,
    }),
  };
}

export type CVLibraryE2EModule = ReturnType<typeof createE2EUseCases> & {
  bindRequest(client: SupabaseClient): CVLibraryE2EModule;
};

export function createCVLibraryE2EModule(
  queryBus: QueryBus,
): CVLibraryE2EModule {
  const useCases = createE2EUseCases(queryBus);
  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      documentRepo.bindRequest(client);
      profileRepo.bindRequest(client);
      pdfStorage.bindRequest(client);
      return this;
    },
  };
}
