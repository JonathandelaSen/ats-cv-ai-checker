import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ReceivedFeedbackNotFoundError } from "../../domain/errors/received-feedback-not-found.error";
import type { ReceivedFeedbackRepository } from "../../domain/repositories/received-feedback.repository";
import { ReceivedFeedbackDate } from "../../domain/value-objects/received-feedback-date.value-object";
import { ReceivedFeedbackGiverName } from "../../domain/value-objects/received-feedback-giver-name.value-object";
import { ReceivedFeedbackId } from "../../domain/value-objects/received-feedback-id.value-object";
import { ReceivedFeedbackNote } from "../../domain/value-objects/received-feedback-note.value-object";
import { ReceivedFeedbackText } from "../../domain/value-objects/received-feedback-text.value-object";
import { recordReceivedFeedbackEvent } from "./tracking";

export interface UpdateReceivedFeedbackInput {
  activityContextId?: string;
  receivedDate?: string;
  giverName?: string;
  feedbackText?: string;
  userNote?: string | null;
  today?: string;
}

export class UpdateReceivedFeedbackUseCase {
  constructor(
    private readonly deps: {
      receivedFeedbackRepo: ReceivedFeedbackRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(
    userId: string,
    id: string,
    input: UpdateReceivedFeedbackInput
  ) {
    const userIdVo = UserId.fromPrimitives(userId);
    const idVo = ReceivedFeedbackId.fromPrimitives(id);
    const feedback = await this.deps.receivedFeedbackRepo.findById(idVo, userIdVo);
    if (!feedback) throw new ReceivedFeedbackNotFoundError();

    feedback.update({
      activityContextId:
        input.activityContextId === undefined
          ? undefined
          : EntityId.fromPrimitives(input.activityContextId),
      receivedDate:
        input.receivedDate === undefined
          ? undefined
          : ReceivedFeedbackDate.fromPrimitives(input.receivedDate, input.today),
      giverName:
        input.giverName === undefined
          ? undefined
          : ReceivedFeedbackGiverName.fromPrimitives(input.giverName),
      feedbackText:
        input.feedbackText === undefined
          ? undefined
          : ReceivedFeedbackText.fromPrimitives(input.feedbackText),
      userNote:
        input.userNote === undefined
          ? undefined
          : ReceivedFeedbackNote.fromPrimitives(input.userNote),
      updatedAt: new Date().toISOString(),
    });

    const saved = await this.deps.receivedFeedbackRepo.save(feedback);
    await recordReceivedFeedbackEvent(this.deps.tracker, {
      userId,
      stage: "received_feedback_updated",
      metadata: { feedbackId: saved.id },
    });
    return saved;
  }
}
