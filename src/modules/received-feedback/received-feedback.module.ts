import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CreateReceivedFeedbackUseCase } from "./application/use-cases/create-received-feedback.use-case";
import { DeleteReceivedFeedbackUseCase } from "./application/use-cases/delete-received-feedback.use-case";
import { ListReceivedFeedbackUseCase } from "./application/use-cases/list-received-feedback.use-case";
import { UpdateReceivedFeedbackUseCase } from "./application/use-cases/update-received-feedback.use-case";
import { SupabaseReceivedFeedbackRepository } from "./infrastructure/repositories/supabase-received-feedback.repository";

export function createReceivedFeedbackModule(
  supabase: SupabaseClient,
  tracker: EventTracker
) {
  const receivedFeedbackRepo = new SupabaseReceivedFeedbackRepository(supabase);

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
