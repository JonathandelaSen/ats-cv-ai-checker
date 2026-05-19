import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseEventTracker } from "@/modules/shared";
import { CreateCommitmentUseCase } from "./application/use-cases/create-commitment.use-case";
import { CreateCommitmentItemUseCase } from "./application/use-cases/create-item.use-case";
import { CreateCommitmentOutcomeUseCase } from "./application/use-cases/create-outcome.use-case";
import { DeleteCommitmentUseCase } from "./application/use-cases/delete-commitment.use-case";
import { DeleteCommitmentItemUseCase } from "./application/use-cases/delete-item.use-case";
import { DeleteCommitmentOutcomeUseCase } from "./application/use-cases/delete-outcome.use-case";
import { ListCommitmentsWorkspaceUseCase } from "./application/use-cases/list-commitments-workspace.use-case";
import { UpdateCommitmentUseCase } from "./application/use-cases/update-commitment.use-case";
import { UpdateCommitmentItemUseCase } from "./application/use-cases/update-item.use-case";
import { UpdateCommitmentOutcomeUseCase } from "./application/use-cases/update-outcome.use-case";
import { SupabaseCommitmentItemRepository } from "./infrastructure/repositories/supabase-commitment-item.repository";
import { SupabaseCommitmentOutcomeRepository } from "./infrastructure/repositories/supabase-commitment-outcome.repository";
import { SupabaseCommitmentRepository } from "./infrastructure/repositories/supabase-commitment.repository";

const commitmentRepo = new SupabaseCommitmentRepository();
const itemRepo = new SupabaseCommitmentItemRepository();
const outcomeRepo = new SupabaseCommitmentOutcomeRepository();
const tracker: EventTracker = new SupabaseEventTracker();

function createUseCases() {
  return {
    listWorkspace: new ListCommitmentsWorkspaceUseCase({
      commitmentRepo,
      itemRepo,
      outcomeRepo,
    }),
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
      commitmentRepo.bindRequest(client);
      itemRepo.bindRequest(client);
      outcomeRepo.bindRequest(client);
      return this;
    },
  };
}
