import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ReceivedFeedback } from "../../domain/entities/received-feedback.entity";
import type { ReceivedFeedbackRepository } from "../../domain/repositories/received-feedback.repository";
import { ReceivedFeedbackDate } from "../../domain/value-objects/received-feedback-date.value-object";
import { ReceivedFeedbackGiverName } from "../../domain/value-objects/received-feedback-giver-name.value-object";
import { ReceivedFeedbackId } from "../../domain/value-objects/received-feedback-id.value-object";
import { ReceivedFeedbackNote } from "../../domain/value-objects/received-feedback-note.value-object";
import { ReceivedFeedbackText } from "../../domain/value-objects/received-feedback-text.value-object";
import { recordReceivedFeedbackEvent } from "./tracking";

export interface CreateReceivedFeedbackInput {
  userId: string;
  receivedDate: string;
  giverName: string;
  feedbackText: string;
  userNote?: string | null;
  activityContextId: string;
  today?: string;
}

export class CreateReceivedFeedbackUseCase {
  constructor(
    private readonly deps: {
      receivedFeedbackRepo: ReceivedFeedbackRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: CreateReceivedFeedbackInput): Promise<ReceivedFeedback> {
    const now = new Date().toISOString();
    const feedback = await this.deps.receivedFeedbackRepo.save(
      ReceivedFeedback.create({
        id: ReceivedFeedbackId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.userId),
        activityContextId: EntityId.fromPrimitives(input.activityContextId),
        receivedDate: ReceivedFeedbackDate.fromPrimitives(input.receivedDate, input.today),
        giverName: ReceivedFeedbackGiverName.fromPrimitives(input.giverName),
        feedbackText: ReceivedFeedbackText.fromPrimitives(input.feedbackText),
        userNote: ReceivedFeedbackNote.fromPrimitives(input.userNote),
        createdAt: now,
        updatedAt: now,
      })
    );

    await recordReceivedFeedbackEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "received_feedback_created",
      metadata: { feedbackId: feedback.id },
    });

    return feedback;
  }
}
