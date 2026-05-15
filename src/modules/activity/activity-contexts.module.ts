import type { SupabaseClient } from "@supabase/supabase-js";
import { CountActivityContextRecordsUseCase } from "./application/use-cases/count-activity-context-records.use-case";
import { CreateActivityContextUseCase } from "./application/use-cases/create-activity-context.use-case";
import { DeleteActivityContextUseCase } from "./application/use-cases/delete-activity-context.use-case";
import { ListActivityContextsUseCase } from "./application/use-cases/list-activity-contexts.use-case";
import { UpdateActivityContextUseCase } from "./application/use-cases/update-activity-context.use-case";
import { SupabaseActivityContextRepository } from "./infrastructure/repositories/supabase-activity-context.repository";

const activityContextRepo = new SupabaseActivityContextRepository();

function createUseCases() {
  return {
    listActivityContexts: new ListActivityContextsUseCase({ activityContextRepo }),
    createActivityContext: new CreateActivityContextUseCase({ activityContextRepo }),
    updateActivityContext: new UpdateActivityContextUseCase({ activityContextRepo }),
    deleteActivityContext: new DeleteActivityContextUseCase({ activityContextRepo }),
    countActivityContextRecords: new CountActivityContextRecordsUseCase({ activityContextRepo }),
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
      return this;
    },
  };
}
