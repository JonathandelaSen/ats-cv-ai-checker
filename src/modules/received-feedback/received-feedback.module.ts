import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { SupabaseEventTracker } from "@/modules/shared";
import { CreateReceivedFeedbackUseCase } from "./application/use-cases/create-received-feedback.use-case";
import { DeleteReceivedFeedbackUseCase } from "./application/use-cases/delete-received-feedback.use-case";
import { ListReceivedFeedbackUseCase } from "./application/use-cases/list-received-feedback.use-case";
import { UpdateReceivedFeedbackUseCase } from "./application/use-cases/update-received-feedback.use-case";
import { SupabaseReceivedFeedbackRepository } from "./infrastructure/repositories/supabase-received-feedback.repository";

const receivedFeedbackRepo = new SupabaseReceivedFeedbackRepository();
const tracker: EventTracker = new SupabaseEventTracker();

function createUseCases() {
  return {
    listReceivedFeedback: new ListReceivedFeedbackUseCase({ receivedFeedbackRepo }),
    createReceivedFeedback: new CreateReceivedFeedbackUseCase({
      receivedFeedbackRepo,
      tracker,
    }),
    updateReceivedFeedback: new UpdateReceivedFeedbackUseCase({
      receivedFeedbackRepo,
      tracker,
    }),
    deleteReceivedFeedback: new DeleteReceivedFeedbackUseCase({
      receivedFeedbackRepo,
      tracker,
    }),
  };
}

export type ReceivedFeedbackModule = ReturnType<typeof createUseCases> & {
  bindRequest(client: SupabaseClient): ReceivedFeedbackModule;
};

export function createReceivedFeedbackModule(): ReceivedFeedbackModule {
  const useCases = createUseCases();

  return {
    ...useCases,
    bindRequest(client: SupabaseClient) {
      receivedFeedbackRepo.bindRequest(client);
      return this;
    },
  };
}
