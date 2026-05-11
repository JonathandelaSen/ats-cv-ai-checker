import {
  AggregateRoot,
  IsoDate,
  OptionalIsoDate,
  Timestamp,
  UserId,
  type UserId as UserIdType,
} from "@/modules/shared";
import { WorkJournalEntryCreatedEvent } from "../events/work-journal-entry-created.event";
import { WorkJournalEntryDeletedEvent } from "../events/work-journal-entry-deleted.event";
import { WorkJournalEntryUpdatedEvent } from "../events/work-journal-entry-updated.event";
import { WorkJournalContextId } from "../value-objects/work-journal-context-id.value-object";
import { WorkJournalEntryId } from "../value-objects/work-journal-entry-id.value-object";
import { WorkJournalFinalText } from "../value-objects/work-journal-final-text.value-object";
import { type EntryInputMode, WorkJournalInputMode } from "../value-objects/work-journal-input-mode.value-object";
import { WorkJournalNotes } from "../value-objects/work-journal-notes.value-object";
import { WorkJournalTopic } from "../value-objects/work-journal-topic.value-object";

export type { EntryInputMode };

export interface WorkJournalEntryPrimitives {
  id: string;
  userId: string;
  contextId: string;
  dateStart: string;
  dateEnd: string | null;
  topic: string | null;
  inputMode: EntryInputMode;
  rawNotes: string;
  finalText: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkJournalEntryCreateParams {
  id: WorkJournalEntryId;
  userId: UserIdType;
  contextId: WorkJournalContextId;
  dateStart: IsoDate;
  dateEnd: OptionalIsoDate;
  topic: WorkJournalTopic;
  inputMode: WorkJournalInputMode;
  rawNotes: WorkJournalNotes;
  finalText: WorkJournalFinalText;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkJournalEntryUpdateParams {
  contextId?: WorkJournalContextId;
  dateStart?: IsoDate;
  dateEnd?: OptionalIsoDate;
  topic?: WorkJournalTopic;
  inputMode?: WorkJournalInputMode;
  rawNotes?: WorkJournalNotes;
  finalText?: WorkJournalFinalText;
}

export class WorkJournalEntry extends AggregateRoot {
  private constructor(
    private readonly entryId: WorkJournalEntryId,
    private readonly ownerId: UserIdType,
    private entryContextId: WorkJournalContextId,
    private entryDateStart: IsoDate,
    private entryDateEnd: OptionalIsoDate,
    private entryTopic: WorkJournalTopic,
    private entryInputMode: WorkJournalInputMode,
    private entryRawNotes: WorkJournalNotes,
    private entryFinalText: WorkJournalFinalText,
    private readonly entryCreatedAt: Timestamp,
    private entryUpdatedAt: Timestamp
  ) {
    super();
  }

  static create(params: WorkJournalEntryCreateParams): WorkJournalEntry {
    const entry = new WorkJournalEntry(
      params.id,
      params.userId,
      params.contextId,
      params.dateStart,
      params.dateEnd,
      params.topic,
      params.inputMode,
      params.rawNotes,
      params.finalText,
      params.createdAt,
      params.updatedAt
    );
    entry.recordDomainEvent(new WorkJournalEntryCreatedEvent(params.id.toPrimitives()));
    return entry;
  }

  static fromPrimitives(primitives: WorkJournalEntryPrimitives): WorkJournalEntry {
    return new WorkJournalEntry(
      WorkJournalEntryId.fromPrimitives(primitives.id),
      UserId.fromPrimitives(primitives.userId),
      WorkJournalContextId.fromPrimitives(primitives.contextId),
      IsoDate.fromPrimitives(primitives.dateStart),
      OptionalIsoDate.fromPrimitives(primitives.dateEnd),
      WorkJournalTopic.fromPrimitives(primitives.topic),
      WorkJournalInputMode.fromPrimitives(primitives.inputMode),
      WorkJournalNotes.fromPrimitives(primitives.rawNotes),
      WorkJournalFinalText.fromPrimitives(primitives.finalText),
      Timestamp.fromPrimitives(primitives.createdAt),
      Timestamp.fromPrimitives(primitives.updatedAt)
    );
  }

  get id(): string {
    return this.entryId.toPrimitives();
  }

  get userId(): string {
    return this.ownerId.toPrimitives();
  }

  get contextId(): string {
    return this.entryContextId.toPrimitives();
  }

  get idValue(): WorkJournalEntryId {
    return this.entryId;
  }

  update(params: WorkJournalEntryUpdateParams): void {
    const fields: string[] = [];
    if (params.contextId) {
      this.entryContextId = params.contextId;
      fields.push("contextId");
    }
    if (params.dateStart) {
      this.entryDateStart = params.dateStart;
      fields.push("dateStart");
    }
    if (params.dateEnd) {
      this.entryDateEnd = params.dateEnd;
      fields.push("dateEnd");
    }
    if (params.topic) {
      this.entryTopic = params.topic;
      fields.push("topic");
    }
    if (params.inputMode) {
      this.entryInputMode = params.inputMode;
      fields.push("inputMode");
    }
    if (params.rawNotes) {
      this.entryRawNotes = params.rawNotes;
      fields.push("rawNotes");
    }
    if (params.finalText) {
      this.entryFinalText = params.finalText;
      fields.push("finalText");
    }
    if (fields.length > 0) {
      this.recordDomainEvent(new WorkJournalEntryUpdatedEvent(this.id, fields));
    }
  }

  delete(): void {
    this.recordDomainEvent(new WorkJournalEntryDeletedEvent(this.id));
  }

  toPrimitives(): WorkJournalEntryPrimitives {
    return {
      id: this.id,
      userId: this.userId,
      contextId: this.contextId,
      dateStart: this.entryDateStart.toPrimitives(),
      dateEnd: this.entryDateEnd.toPrimitives(),
      topic: this.entryTopic.toPrimitives(),
      inputMode: this.entryInputMode.toPrimitives(),
      rawNotes: this.entryRawNotes.toPrimitives(),
      finalText: this.entryFinalText.toPrimitives(),
      createdAt: this.entryCreatedAt.toPrimitives(),
      updatedAt: this.entryUpdatedAt.toPrimitives(),
    };
  }
}
