import type { SupabaseClient } from "@supabase/supabase-js";
import type { QueryBus } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseEventTracker } from "@/modules/shared";
import { CreateTemplateCVDocumentUseCase } from "./application/use-cases/create-template-cv-document.use-case";
import { CreateUploadedCVDocumentUseCase } from "./application/use-cases/create-uploaded-cv-document.use-case";
import { DeleteCVDocumentUseCase } from "./application/use-cases/delete-cv-document.use-case";
import { EditCVProfileWithAIUseCase } from "./application/use-cases/edit-cv-profile-with-ai.use-case";
import { GetCVDocumentUseCase } from "./application/use-cases/get-cv-document.use-case";
import { GetCVStructuredProfileUseCase } from "./application/use-cases/get-cv-structured-profile.use-case";
import { GetPublishedCVDocumentUseCase } from "./application/use-cases/get-published-cv-document.use-case";
import { ListCVDocumentsUseCase } from "./application/use-cases/list-cv-documents.use-case";
import { PrepareCVAnalysisInputUseCase } from "./application/use-cases/prepare-cv-analysis-input.use-case";
import { StructureCVProfileWithAIUseCase } from "./application/use-cases/structure-cv-profile-with-ai.use-case";
import { UpdateCVDocumentNameUseCase } from "./application/use-cases/update-cv-document-name.use-case";
import { UpdateCVDocumentExtractionUseCase } from "./application/use-cases/update-cv-document-extraction.use-case";
import { UpdateCVDocumentPublicSettingsUseCase } from "./application/use-cases/update-cv-document-public-settings.use-case";
import { UpdateTemplateCVDocumentProfileUseCase } from "./application/use-cases/update-template-cv-document-profile.use-case";
import { UpsertCVStructuredProfileUseCase } from "./application/use-cases/upsert-cv-structured-profile.use-case";
import { SupabaseCVDocumentRepository } from "./infrastructure/repositories/supabase-cv-document.repository";
import { SupabaseCVStructuredProfileRepository } from "./infrastructure/repositories/supabase-cv-structured-profile.repository";
import { PdfTextExtractor } from "./infrastructure/services/pdf-text-extractor.service";
import { GeminiCVProfileEditingAIServiceFactory } from "./infrastructure/services/gemini-cv-profile-editing-ai.service";
import { GeminiCVProfileStructuringAIServiceFactory } from "./infrastructure/services/gemini-cv-profile-structuring-ai.service";
import { MockCVProfileEditingAIServiceFactory } from "./infrastructure/services/mock-cv-profile-editing-ai.service";
import { MockCVProfileStructuringAIServiceFactory } from "./infrastructure/services/mock-cv-profile-structuring-ai.service";
import { ProviderCVProfileEditingAIServiceFactory } from "./infrastructure/services/provider-cv-profile-editing-ai-service.factory";
import { ProviderCVProfileStructuringAIServiceFactory } from "./infrastructure/services/provider-cv-profile-structuring-ai-service.factory";
import { SupabaseCVPdfStorage } from "./infrastructure/services/supabase-cv-pdf-storage.service";
import { TemplateCVPdfRenderer } from "./infrastructure/services/template-cv-pdf-renderer.service";

const documentRepo = new SupabaseCVDocumentRepository();
const profileRepo = new SupabaseCVStructuredProfileRepository();
const pdfStorage = new SupabaseCVPdfStorage();
const textExtractor = new PdfTextExtractor();
const templateRenderer = new TemplateCVPdfRenderer();
const profileStructuringAI = new ProviderCVProfileStructuringAIServiceFactory({
  geminiFactory: new GeminiCVProfileStructuringAIServiceFactory(),
  mockFactory: new MockCVProfileStructuringAIServiceFactory(),
});
const profileEditingAI = new ProviderCVProfileEditingAIServiceFactory({
  geminiFactory: new GeminiCVProfileEditingAIServiceFactory(),
  mockFactory: new MockCVProfileEditingAIServiceFactory(),
});
const tracker: EventTracker = new SupabaseEventTracker();

function createUseCases(queryBus: QueryBus) {
  return {
    listCVDocuments: new ListCVDocumentsUseCase({ documentRepo }),
    getCVDocument: new GetCVDocumentUseCase({ documentRepo }),
    createUploadedCVDocument: new CreateUploadedCVDocumentUseCase({
      documentRepo,
      tracker,
    }),
    createTemplateCVDocument: new CreateTemplateCVDocumentUseCase({
      documentRepo,
      tracker,
    }),
    updateCVDocumentName: new UpdateCVDocumentNameUseCase({
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
      textExtractor,
      templateRenderer,
      tracker,
    }),
    updateCVDocumentPublicSettings: new UpdateCVDocumentPublicSettingsUseCase({
      documentRepo,
      tracker,
    }),
    updateTemplateCVDocumentProfile: new UpdateTemplateCVDocumentProfileUseCase(
      {
        documentRepo,
        tracker,
      },
    ),
    deleteCVDocument: new DeleteCVDocumentUseCase({
      documentRepo,
      queryBus,
      tracker,
    }),
    getPublishedCVDocument: new GetPublishedCVDocumentUseCase({ documentRepo }),
    getCVStructuredProfile: new GetCVStructuredProfileUseCase({ profileRepo }),
    structureCVProfileWithAI: new StructureCVProfileWithAIUseCase({
      aiFactory: profileStructuringAI,
    }),
    editCVProfileWithAI: new EditCVProfileWithAIUseCase({
      aiFactory: profileEditingAI,
    }),
    upsertCVStructuredProfile: new UpsertCVStructuredProfileUseCase({
      profileRepo,
      tracker,
    }),
  };
}

export type CVLibraryModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): CVLibraryModule;
};

export function createCVLibraryModule(queryBus: QueryBus): CVLibraryModule {
  const useCases = createUseCases(queryBus);
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
