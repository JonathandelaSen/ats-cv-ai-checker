import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseEventTracker } from "@/modules/shared";
import { CreateEntryUseCase } from "./application/use-cases/create-entry.use-case";
import { CreateFeedbackUseCase } from "./application/use-cases/create-feedback.use-case";
import { DeleteEntryUseCase } from "./application/use-cases/delete-entry.use-case";
import { DeleteFeedbackUseCase } from "./application/use-cases/delete-feedback.use-case";
import { GenerateFinalFeedbackUseCase } from "./application/use-cases/generate-final-feedback.use-case";
import { ListEntriesUseCase } from "./application/use-cases/list-entries.use-case";
import { ListFeedbacksUseCase } from "./application/use-cases/list-feedbacks.use-case";
import { CloseFeedbackUseCase } from "./application/use-cases/close-feedback.use-case";
import { ReopenFeedbackUseCase } from "./application/use-cases/reopen-feedback.use-case";
import { UpdateEntryUseCase } from "./application/use-cases/update-entry.use-case";
import { UpdateFeedbackUseCase } from "./application/use-cases/update-feedback.use-case";
import { SupabaseFeedbackEntryRepository } from "./infrastructure/repositories/supabase-feedback-entry.repository";
import { SupabaseFeedbackRepository } from "./infrastructure/repositories/supabase-feedback.repository";
import { GeminiFeedbackAIServiceFactory } from "./infrastructure/services/gemini-feedback-ai.service";
import { MockFeedbackAIServiceFactory } from "./infrastructure/services/mock-feedback-ai.service";
import { ProviderFeedbackAIServiceFactory } from "./infrastructure/services/provider-feedback-ai-service.factory";

const feedbackRepo = new SupabaseFeedbackRepository();
const entryRepo = new SupabaseFeedbackEntryRepository();
const tracker: EventTracker = new SupabaseEventTracker();
const aiFactory = new ProviderFeedbackAIServiceFactory({
  geminiFactory: new GeminiFeedbackAIServiceFactory(),
  mockFactory: new MockFeedbackAIServiceFactory(),
});

function createUseCases() {
  return {
    listFeedbacks: new ListFeedbacksUseCase({ feedbackRepo }),
    createFeedback: new CreateFeedbackUseCase({ feedbackRepo, tracker }),
    updateFeedback: new UpdateFeedbackUseCase({ feedbackRepo, tracker }),
    closeFeedback: new CloseFeedbackUseCase({ feedbackRepo, tracker }),
    reopenFeedback: new ReopenFeedbackUseCase({ feedbackRepo, tracker }),
    deleteFeedback: new DeleteFeedbackUseCase({ feedbackRepo, tracker }),
    listEntries: new ListEntriesUseCase({ feedbackRepo, entryRepo }),
    createEntry: new CreateEntryUseCase({ feedbackRepo, entryRepo, tracker }),
    updateEntry: new UpdateEntryUseCase({ feedbackRepo, entryRepo, tracker }),
    deleteEntry: new DeleteEntryUseCase({ feedbackRepo, entryRepo, tracker }),
    generateFinalFeedback: new GenerateFinalFeedbackUseCase({
      feedbackRepo,
      entryRepo,
      aiFactory,
      tracker,
    }),
  };
}

export type FeedbackNotesModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): FeedbackNotesModule;
};

export function createFeedbackNotesModule(): FeedbackNotesModule {
  const useCases = createUseCases();

  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      feedbackRepo.bindRequest(client);
      entryRepo.bindRequest(client);
      return this;
    },
  };
}
