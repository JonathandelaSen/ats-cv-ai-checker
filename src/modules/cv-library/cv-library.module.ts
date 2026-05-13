import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseEventTracker } from "@/modules/shared";
import { CreateTemplateCVDocumentUseCase } from "./application/use-cases/create-template-cv-document.use-case";
import { CreateUploadedCVDocumentUseCase } from "./application/use-cases/create-uploaded-cv-document.use-case";
import { DeleteCVDocumentUseCase } from "./application/use-cases/delete-cv-document.use-case";
import { GetCVDocumentUseCase } from "./application/use-cases/get-cv-document.use-case";
import { GetCVStructuredProfileUseCase } from "./application/use-cases/get-cv-structured-profile.use-case";
import { GetPublishedCVDocumentUseCase } from "./application/use-cases/get-published-cv-document.use-case";
import { ListCVDocumentsUseCase } from "./application/use-cases/list-cv-documents.use-case";
import { UpdateCVDocumentNameUseCase } from "./application/use-cases/update-cv-document-name.use-case";
import { UpdateCVDocumentExtractionUseCase } from "./application/use-cases/update-cv-document-extraction.use-case";
import { UpdateCVDocumentPublicSettingsUseCase } from "./application/use-cases/update-cv-document-public-settings.use-case";
import { UpdateTemplateCVDocumentProfileUseCase } from "./application/use-cases/update-template-cv-document-profile.use-case";
import { UpsertCVStructuredProfileUseCase } from "./application/use-cases/upsert-cv-structured-profile.use-case";
import { SupabaseCVDocumentRepository } from "./infrastructure/repositories/supabase-cv-document.repository";
import { SupabaseCVStructuredProfileRepository } from "./infrastructure/repositories/supabase-cv-structured-profile.repository";

const documentRepo = new SupabaseCVDocumentRepository();
const profileRepo = new SupabaseCVStructuredProfileRepository();
const tracker: EventTracker = new SupabaseEventTracker();

function createUseCases() {
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
    deleteCVDocument: new DeleteCVDocumentUseCase({ documentRepo, tracker }),
    getPublishedCVDocument: new GetPublishedCVDocumentUseCase({ documentRepo }),
    getCVStructuredProfile: new GetCVStructuredProfileUseCase({ profileRepo }),
    upsertCVStructuredProfile: new UpsertCVStructuredProfileUseCase({
      profileRepo,
      tracker,
    }),
  };
}

export type CVLibraryModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): CVLibraryModule;
};

export function createCVLibraryModule(): CVLibraryModule {
  const useCases = createUseCases();
  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      documentRepo.bindRequest(client);
      profileRepo.bindRequest(client);
      return this;
    },
  };
}
