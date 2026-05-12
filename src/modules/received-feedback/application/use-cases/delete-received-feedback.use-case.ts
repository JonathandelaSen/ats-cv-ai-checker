import { UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ReceivedFeedbackNotFoundError } from "../../domain/errors/received-feedback-not-found.error";
import type { ReceivedFeedbackRepository } from "../../domain/repositories/received-feedback.repository";
import { ReceivedFeedbackId } from "../../domain/value-objects/received-feedback-id.value-object";
import { recordReceivedFeedbackEvent } from "./tracking";

export class DeleteReceivedFeedbackUseCase {
  constructor(
    private readonly deps: {
      receivedFeedbackRepo: ReceivedFeedbackRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const userIdVo = UserId.fromPrimitives(userId);
    const idVo = ReceivedFeedbackId.fromPrimitives(id);
    const feedback = await this.deps.receivedFeedbackRepo.findById(idVo, userIdVo);
    if (!feedback) throw new ReceivedFeedbackNotFoundError();

    feedback.delete();
    await this.deps.receivedFeedbackRepo.delete(idVo, userIdVo);
    await recordReceivedFeedbackEvent(this.deps.tracker, {
      userId,
      stage: "received_feedback_deleted",
      metadata: { feedbackId: id },
    });
  }
}
