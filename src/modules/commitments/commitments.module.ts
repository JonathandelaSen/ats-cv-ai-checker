import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseEventTracker } from "@/modules/shared";
import { CreateCommitmentUseCase } from "./application/use-cases/create-commitment.use-case";
import { CreateCommitmentContextUseCase } from "./application/use-cases/create-context.use-case";
import { CreateCommitmentItemUseCase } from "./application/use-cases/create-item.use-case";
import { CreateCommitmentOutcomeUseCase } from "./application/use-cases/create-outcome.use-case";
import { DeleteCommitmentUseCase } from "./application/use-cases/delete-commitment.use-case";
import { DeleteCommitmentItemUseCase } from "./application/use-cases/delete-item.use-case";
import { DeleteCommitmentOutcomeUseCase } from "./application/use-cases/delete-outcome.use-case";
import { EnsureDefaultCommitmentContextUseCase } from "./application/use-cases/ensure-default-context.use-case";
import { ListCommitmentsWorkspaceUseCase } from "./application/use-cases/list-commitments-workspace.use-case";
import { UpdateCommitmentUseCase } from "./application/use-cases/update-commitment.use-case";
import { UpdateCommitmentContextUseCase } from "./application/use-cases/update-context.use-case";
import { UpdateCommitmentItemUseCase } from "./application/use-cases/update-item.use-case";
import { UpdateCommitmentOutcomeUseCase } from "./application/use-cases/update-outcome.use-case";
import { SupabaseCommitmentContextRepository } from "./infrastructure/repositories/supabase-commitment-context.repository";
import { SupabaseCommitmentItemRepository } from "./infrastructure/repositories/supabase-commitment-item.repository";
import { SupabaseCommitmentOutcomeRepository } from "./infrastructure/repositories/supabase-commitment-outcome.repository";
import { SupabaseCommitmentRepository } from "./infrastructure/repositories/supabase-commitment.repository";

const contextRepo = new SupabaseCommitmentContextRepository();
const commitmentRepo = new SupabaseCommitmentRepository();
const itemRepo = new SupabaseCommitmentItemRepository();
const outcomeRepo = new SupabaseCommitmentOutcomeRepository();
const tracker: EventTracker = new SupabaseEventTracker();

function createUseCases() {
  return {
    ensureDefaultContext: new EnsureDefaultCommitmentContextUseCase({ contextRepo }),
    listWorkspace: new ListCommitmentsWorkspaceUseCase({
      contextRepo,
      commitmentRepo,
      itemRepo,
      outcomeRepo,
    }),
    createContext: new CreateCommitmentContextUseCase({ contextRepo, tracker }),
    updateContext: new UpdateCommitmentContextUseCase({ contextRepo, tracker }),
    createCommitment: new CreateCommitmentUseCase({ commitmentRepo, tracker }),
    updateCommitment: new UpdateCommitmentUseCase({ commitmentRepo, tracker }),
    deleteCommitment: new DeleteCommitmentUseCase({ commitmentRepo, tracker }),
    createItem: new CreateCommitmentItemUseCase({ itemRepo, tracker }),
    updateItem: new UpdateCommitmentItemUseCase({ itemRepo, tracker }),
    deleteItem: new DeleteCommitmentItemUseCase({ itemRepo, tracker }),
    createOutcome: new CreateCommitmentOutcomeUseCase({ outcomeRepo, tracker }),
    updateOutcome: new UpdateCommitmentOutcomeUseCase({ outcomeRepo, tracker }),
    deleteOutcome: new DeleteCommitmentOutcomeUseCase({ outcomeRepo, tracker }),
  };
}

export type CommitmentsModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): CommitmentsModule;
};

export function createCommitmentsModule(): CommitmentsModule {
  const useCases = createUseCases();

  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      contextRepo.bindRequest(client);
      commitmentRepo.bindRequest(client);
      itemRepo.bindRequest(client);
      outcomeRepo.bindRequest(client);
      return this;
    },
  };
}
