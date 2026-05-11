import { UserId } from "@/modules/shared";
import { WorkJournalEntry } from "../../domain/entities/journal-entry.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type { WorkJournalEntryRepository } from "../../domain/repositories/work-journal-entry.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { ContextArchivedError } from "../../domain/errors/context-archived.error";
import { createRequestId } from "@/lib/observability";
import {
  type EntryInputMode,
  WorkJournalContextId,
  WorkJournalDate,
  WorkJournalEntryId,
  WorkJournalFinalText,
  WorkJournalInputMode,
  WorkJournalIsDefault,
  WorkJournalNotes,
  WorkJournalOptionalDate,
  WorkJournalTimestamp,
  WorkJournalTopic,
} from "../../domain/value-objects/work-journal.value-object";

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
      contextRepo: WorkJournalContextRepository;
      entryRepo: WorkJournalEntryRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: CreateEntryInput): Promise<WorkJournalEntry> {
    const userId = UserId.fromPrimitives(input.user_id);
    const contextId = WorkJournalContextId.fromPrimitives(input.context_id);
    const context = await this.deps.contextRepo.findById(contextId, userId);
    if (!context) throw new ContextNotFoundError(input.context_id);
    if (!context.isActive()) throw new ContextArchivedError(input.context_id);

    context.update({ isDefault: WorkJournalIsDefault.fromPrimitives(true) });
    await this.deps.contextRepo.save(context);

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
        dateStart: WorkJournalDate.fromPrimitives(input.date_start),
        dateEnd: WorkJournalOptionalDate.fromPrimitives(input.date_end),
        topic: WorkJournalTopic.fromPrimitives(input.topic),
        inputMode: WorkJournalInputMode.fromPrimitives(input.input_mode),
        rawNotes: WorkJournalNotes.fromPrimitives(input.raw_notes),
        finalText: WorkJournalFinalText.fromPrimitives(input.final_text),
        createdAt: WorkJournalTimestamp.fromPrimitives(now),
        updatedAt: WorkJournalTimestamp.fromPrimitives(now),
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
