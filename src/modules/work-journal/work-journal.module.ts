import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseEventTracker } from "@/modules/shared";
import { SupabaseWorkJournalEntryRepository } from "./infrastructure/repositories/supabase-work-journal-entry.repository";
import { GeminiJournalAIServiceFactory } from "./infrastructure/services/gemini-journal-ai.service";
import { MockJournalAIServiceFactory } from "./infrastructure/services/mock-journal-ai.service";
import { ProviderJournalAIServiceFactory } from "./infrastructure/services/provider-journal-ai-service.factory";
import { ListEntriesUseCase } from "./application/use-cases/list-entries.use-case";
import { CreateEntryUseCase } from "./application/use-cases/create-entry.use-case";
import { UpdateEntryUseCase } from "./application/use-cases/update-entry.use-case";
import { DeleteEntryUseCase } from "./application/use-cases/delete-entry.use-case";
import { DraftEntryUseCase } from "./application/use-cases/draft-entry.use-case";

const entryRepo = new SupabaseWorkJournalEntryRepository();
const tracker: EventTracker = new SupabaseEventTracker();
const aiFactory = new ProviderJournalAIServiceFactory({
  geminiFactory: new GeminiJournalAIServiceFactory(),
  mockFactory: new MockJournalAIServiceFactory(),
});

function createUseCases() {
  return {
    listEntries: new ListEntriesUseCase({ entryRepo }),
    createEntry: new CreateEntryUseCase({ entryRepo, tracker }),
    updateEntry: new UpdateEntryUseCase({ entryRepo, tracker }),
    deleteEntry: new DeleteEntryUseCase({ entryRepo, tracker }),
    draftEntry: new DraftEntryUseCase({ aiFactory, tracker }),
  };
}

export type WorkJournalModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): WorkJournalModule;
};

export function createWorkJournalModule(): WorkJournalModule {
  const useCases = createUseCases();

  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      entryRepo.bindRequest(client);
      return this;
    },
  };
}
