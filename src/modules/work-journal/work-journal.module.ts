import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseWorkJournalContextRepository } from "./infrastructure/repositories/supabase-work-journal-context.repository";
import { SupabaseWorkJournalEntryRepository } from "./infrastructure/repositories/supabase-work-journal-entry.repository";
import { SupabaseCVDataRepository } from "./infrastructure/repositories/supabase-cv-data.repository";
import { GeminiJournalAIService } from "./infrastructure/services/gemini-journal-ai.service";
import { ListContextsUseCase } from "./application/use-cases/list-contexts.use-case";
import { CreateContextUseCase } from "./application/use-cases/create-context.use-case";
import { UpdateContextUseCase } from "./application/use-cases/update-context.use-case";
import { EnsureDefaultContextUseCase } from "./application/use-cases/ensure-default-context.use-case";
import { ListContextSuggestionsUseCase } from "./application/use-cases/list-context-suggestions.use-case";
import { HandleSuggestionActionUseCase } from "./application/use-cases/handle-suggestion-action.use-case";
import { ListEntriesUseCase } from "./application/use-cases/list-entries.use-case";
import { CreateEntryUseCase } from "./application/use-cases/create-entry.use-case";
import { UpdateEntryUseCase } from "./application/use-cases/update-entry.use-case";
import { DeleteEntryUseCase } from "./application/use-cases/delete-entry.use-case";
import { DraftEntryUseCase } from "./application/use-cases/draft-entry.use-case";

export function createWorkJournalModule(
  supabase: SupabaseClient,
  tracker: EventTracker
) {
  const contextRepo = new SupabaseWorkJournalContextRepository(supabase);
  const entryRepo = new SupabaseWorkJournalEntryRepository(supabase);
  const cvDataRepo = new SupabaseCVDataRepository(supabase);

  return {
    listContexts: new ListContextsUseCase({ contextRepo }),
    createContext: new CreateContextUseCase({ contextRepo, tracker }),
    updateContext: new UpdateContextUseCase({ contextRepo, tracker }),
    ensureDefaultContext: new EnsureDefaultContextUseCase({ contextRepo, cvDataRepo, tracker }),
    listContextSuggestions: new ListContextSuggestionsUseCase({ contextRepo, cvDataRepo }),
    handleSuggestionAction: new HandleSuggestionActionUseCase({ contextRepo, tracker }),
    listEntries: new ListEntriesUseCase({ entryRepo }),
    createEntry: new CreateEntryUseCase({ contextRepo, entryRepo, tracker }),
    updateEntry: new UpdateEntryUseCase({ contextRepo, entryRepo, tracker }),
    deleteEntry: new DeleteEntryUseCase({ entryRepo, tracker }),
    createDraftEntryUseCase: (aiConfig: { apiKey: string; model: string }) => {
      const aiService = new GeminiJournalAIService(aiConfig);
      return new DraftEntryUseCase({ contextRepo, aiService, tracker });
    },
  };
}
