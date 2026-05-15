import { AggregateRoot, EntityId, UserId } from "@/modules/shared";
import { ReceivedFeedbackCreatedEvent } from "../events/received-feedback-created.event";
import { ReceivedFeedbackDeletedEvent } from "../events/received-feedback-deleted.event";
import { ReceivedFeedbackUpdatedEvent } from "../events/received-feedback-updated.event";
import { ReceivedFeedbackDate } from "../value-objects/received-feedback-date.value-object";
import { ReceivedFeedbackGiverName } from "../value-objects/received-feedback-giver-name.value-object";
import { ReceivedFeedbackId } from "../value-objects/received-feedback-id.value-object";
import { ReceivedFeedbackNote } from "../value-objects/received-feedback-note.value-object";
import { ReceivedFeedbackText } from "../value-objects/received-feedback-text.value-object";

export interface ReceivedFeedbackPrimitives {
  id: string;
  userId: string;
  activityContextId: string;
  receivedDate: string;
  giverName: string;
  feedbackText: string;
  userNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivedFeedbackCreateParams {
  id: ReceivedFeedbackId;
  userId: UserId;
  activityContextId: EntityId;
  receivedDate: ReceivedFeedbackDate;
  giverName: ReceivedFeedbackGiverName;
  feedbackText: ReceivedFeedbackText;
  userNote: ReceivedFeedbackNote;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivedFeedbackUpdateParams {
  activityContextId?: EntityId;
  receivedDate?: ReceivedFeedbackDate;
  giverName?: ReceivedFeedbackGiverName;
  feedbackText?: ReceivedFeedbackText;
  userNote?: ReceivedFeedbackNote;
  updatedAt: string;
}

export class ReceivedFeedback extends AggregateRoot {
  private constructor(
    private readonly feedbackId: ReceivedFeedbackId,
    private readonly feedbackUserId: UserId,
    private feedbackActivityContextId: EntityId,
    private feedbackReceivedDate: ReceivedFeedbackDate,
    private feedbackGiverName: ReceivedFeedbackGiverName,
    private feedbackTextValue: ReceivedFeedbackText,
    private feedbackUserNote: ReceivedFeedbackNote,
    private readonly feedbackCreatedAt: string,
    private feedbackUpdatedAt: string
  ) {
    super();
  }

  static create(params: ReceivedFeedbackCreateParams): ReceivedFeedback {
    const feedback = new ReceivedFeedback(
      params.id,
      params.userId,
      params.activityContextId,
      params.receivedDate,
      params.giverName,
      params.feedbackText,
      params.userNote,
      params.createdAt,
      params.updatedAt
    );
    feedback.recordDomainEvent(new ReceivedFeedbackCreatedEvent(params.id.toPrimitives()));
    return feedback;
  }

  static fromPrimitives(primitives: ReceivedFeedbackPrimitives): ReceivedFeedback {
    return new ReceivedFeedback(
      ReceivedFeedbackId.fromPrimitives(primitives.id),
      UserId.fromPrimitives(primitives.userId),
      EntityId.fromPrimitives(primitives.activityContextId),
      ReceivedFeedbackDate.fromPrimitives(primitives.receivedDate),
      ReceivedFeedbackGiverName.fromPrimitives(primitives.giverName),
      ReceivedFeedbackText.fromPrimitives(primitives.feedbackText),
      ReceivedFeedbackNote.fromPrimitives(primitives.userNote),
      primitives.createdAt,
      primitives.updatedAt
    );
  }

  get id(): string {
    return this.feedbackId.toPrimitives();
  }

  get idValue(): ReceivedFeedbackId {
    return this.feedbackId;
  }

  get userIdValue(): UserId {
    return this.feedbackUserId;
  }

  get activityContextId(): string {
    return this.feedbackActivityContextId.toPrimitives();
  }

  update(params: ReceivedFeedbackUpdateParams): void {
    const fields: string[] = [];
    if (params.activityContextId) {
      this.feedbackActivityContextId = params.activityContextId;
      fields.push("activityContextId");
    }
    if (params.receivedDate) {
      this.feedbackReceivedDate = params.receivedDate;
      fields.push("receivedDate");
    }
    if (params.giverName) {
      this.feedbackGiverName = params.giverName;
      fields.push("giverName");
    }
    if (params.feedbackText) {
      this.feedbackTextValue = params.feedbackText;
      fields.push("feedbackText");
    }
    if (params.userNote) {
      this.feedbackUserNote = params.userNote;
      fields.push("userNote");
    }
    this.feedbackUpdatedAt = params.updatedAt;
    if (fields.length > 0) {
      this.recordDomainEvent(new ReceivedFeedbackUpdatedEvent(this.id, fields));
    }
  }

  delete(): void {
    this.recordDomainEvent(new ReceivedFeedbackDeletedEvent(this.id));
  }

  toPrimitives(): ReceivedFeedbackPrimitives {
    return {
      id: this.feedbackId.toPrimitives(),
      userId: this.feedbackUserId.toPrimitives(),
      activityContextId: this.activityContextId,
      receivedDate: this.feedbackReceivedDate.toPrimitives(),
      giverName: this.feedbackGiverName.toPrimitives(),
      feedbackText: this.feedbackTextValue.toPrimitives(),
      userNote: this.feedbackUserNote.toPrimitives(),
      createdAt: this.feedbackCreatedAt,
      updatedAt: this.feedbackUpdatedAt,
    };
  }
}
