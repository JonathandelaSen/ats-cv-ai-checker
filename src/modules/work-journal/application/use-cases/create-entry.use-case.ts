import { IsoDate, OptionalIsoDate, Timestamp, UserId } from "@/modules/shared";
import { WorkJournalEntry } from "../../domain/entities/journal-entry.entity";
import type { WorkJournalEntryRepository } from "../../domain/repositories/work-journal-entry.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { createRequestId } from "@/lib/observability";
import { WorkJournalContextId } from "../../domain/value-objects/work-journal-context-id.value-object";
import { WorkJournalEntryId } from "../../domain/value-objects/work-journal-entry-id.value-object";
import { WorkJournalFinalText } from "../../domain/value-objects/work-journal-final-text.value-object";
import { type EntryInputMode, WorkJournalInputMode } from "../../domain/value-objects/work-journal-input-mode.value-object";
import { WorkJournalNotes } from "../../domain/value-objects/work-journal-notes.value-object";
import { WorkJournalTopic } from "../../domain/value-objects/work-journal-topic.value-object";

export interface CreateEntryInput {
  user_id: string;
  context_id: string;
  date_start: string;
  date_end: string | null;
  topic: string | null;
  input_mode: EntryInputMode;
  raw_notes: string;
  final_text: string;
}

export class CreateEntryUseCase {
  constructor(
    private readonly deps: {
      entryRepo: WorkJournalEntryRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: CreateEntryInput): Promise<WorkJournalEntry> {
    const userId = UserId.fromPrimitives(input.user_id);
    const contextId = WorkJournalContextId.fromPrimitives(input.context_id);

    const requestId = createRequestId("wj-entry");
    await this.deps.tracker.record({
      userId: input.user_id,
      requestId,
      stage: "work_journal_entry_create",
      status: "started",
    });

    const now = new Date().toISOString();
    const entry = await this.deps.entryRepo.save(
      WorkJournalEntry.create({
        id: WorkJournalEntryId.fromPrimitives(crypto.randomUUID()),
        userId,
        contextId,
        dateStart: IsoDate.fromPrimitives(input.date_start),
        dateEnd: OptionalIsoDate.fromPrimitives(input.date_end),
        topic: WorkJournalTopic.fromPrimitives(input.topic),
        inputMode: WorkJournalInputMode.fromPrimitives(input.input_mode),
        rawNotes: WorkJournalNotes.fromPrimitives(input.raw_notes),
        finalText: WorkJournalFinalText.fromPrimitives(input.final_text),
        createdAt: Timestamp.fromPrimitives(now),
        updatedAt: Timestamp.fromPrimitives(now),
      })
    );

    await this.deps.tracker.record({
      userId: input.user_id,
      requestId,
      stage: "work_journal_entry_create",
      status: "success",
      metadata: { entryId: entry.id, contextId: input.context_id },
    });

    return entry;
  }
}
