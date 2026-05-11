import { UserId } from "@/modules/shared";
import type { WorkJournalEntry } from "../../domain/entities/journal-entry.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type { WorkJournalEntryRepository } from "../../domain/repositories/work-journal-entry.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { EntryNotFoundError } from "../../domain/errors/entry-not-found.error";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { createRequestId } from "@/lib/observability";
import {
  type EntryInputMode,
  WorkJournalContextId,
  WorkJournalDate,
  WorkJournalEntryId,
  WorkJournalFinalText,
  WorkJournalInputMode,
  WorkJournalNotes,
  WorkJournalOptionalDate,
  WorkJournalTopic,
} from "../../domain/value-objects/work-journal.value-object";

export interface UpdateEntryInput {
  context_id?: string;
  date_start?: string;
  date_end?: string | null;
  topic?: string | null;
  input_mode?: EntryInputMode;
  raw_notes?: string;
  final_text?: string;
}

export class UpdateEntryUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      entryRepo: WorkJournalEntryRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(id: string, userId: string, data: UpdateEntryInput): Promise<WorkJournalEntry> {
    const ownerId = UserId.fromPrimitives(userId);
    if (data.context_id) {
      const context = await this.deps.contextRepo.findById(
        WorkJournalContextId.fromPrimitives(data.context_id),
        ownerId
      );
      if (!context) throw new ContextNotFoundError(data.context_id);
    }

    const entryId = WorkJournalEntryId.fromPrimitives(id);
    const entry = await this.deps.entryRepo.findById(entryId, ownerId);
    if (!entry) throw new EntryNotFoundError(id);
    entry.update({
      contextId: data.context_id ? WorkJournalContextId.fromPrimitives(data.context_id) : undefined,
      dateStart: data.date_start ? WorkJournalDate.fromPrimitives(data.date_start) : undefined,
      dateEnd:
        data.date_end !== undefined
          ? WorkJournalOptionalDate.fromPrimitives(data.date_end)
          : undefined,
      topic: data.topic !== undefined ? WorkJournalTopic.fromPrimitives(data.topic) : undefined,
      inputMode: data.input_mode ? WorkJournalInputMode.fromPrimitives(data.input_mode) : undefined,
      rawNotes: data.raw_notes ? WorkJournalNotes.fromPrimitives(data.raw_notes) : undefined,
      finalText: data.final_text ? WorkJournalFinalText.fromPrimitives(data.final_text) : undefined,
    });
    const saved = await this.deps.entryRepo.save(entry);

    const requestId = createRequestId("wj-entry");
    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_entry_update",
      status: "success",
      metadata: { entryId: id, fields: Object.keys(data) },
    });

    return saved;
  }
}
