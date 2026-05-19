import type { SupabaseClient } from "@supabase/supabase-js";
import { CountActivityContextRecordsUseCase } from "./application/use-cases/count-activity-context-records.use-case";
import { CreateActivityContextUseCase } from "./application/use-cases/create-activity-context.use-case";
import { DeleteActivityContextUseCase } from "./application/use-cases/delete-activity-context.use-case";
import { HandleActivityContextSuggestionUseCase } from "./application/use-cases/handle-activity-context-suggestion.use-case";
import { ListActivityContextSuggestionsUseCase } from "./application/use-cases/list-activity-context-suggestions.use-case";
import { ListActivityContextsUseCase } from "./application/use-cases/list-activity-contexts.use-case";
import { UpdateActivityContextUseCase } from "./application/use-cases/update-activity-context.use-case";
import { SupabaseEventTracker } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseActivityContextRepository } from "./infrastructure/repositories/supabase-activity-context.repository";
import { SupabaseCVDataRepository } from "./infrastructure/repositories/supabase-cv-data.repository";

const activityContextRepo = new SupabaseActivityContextRepository();
const cvDataRepo = new SupabaseCVDataRepository();
const tracker: EventTracker = new SupabaseEventTracker();

function createUseCases() {
  return {
    listActivityContexts: new ListActivityContextsUseCase({ activityContextRepo }),
    listActivityContextSuggestions: new ListActivityContextSuggestionsUseCase({
      activityContextRepo,
      cvDataRepo,
    }),
    createActivityContext: new CreateActivityContextUseCase({ activityContextRepo }),
    updateActivityContext: new UpdateActivityContextUseCase({ activityContextRepo }),
    deleteActivityContext: new DeleteActivityContextUseCase({ activityContextRepo }),
    countActivityContextRecords: new CountActivityContextRecordsUseCase({ activityContextRepo }),
    handleActivityContextSuggestion: new HandleActivityContextSuggestionUseCase({
      activityContextRepo,
      tracker,
    }),
  };
}

export type ActivityContextsModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): ActivityContextsModule;
};

export function createActivityContextsModule(): ActivityContextsModule {
  const useCases = createUseCases();

  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      activityContextRepo.bindRequest(client);
      cvDataRepo.bindRequest(client);
      return this;
    },
  };
}
