import type { WorkJournalEntry } from "../../domain/entities/journal-entry.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type {
  UpdateEntryInput,
  WorkJournalEntryRepository,
} from "../../domain/repositories/work-journal-entry.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { EntryNotFoundError } from "../../domain/errors/entry-not-found.error";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { createRequestId } from "@/lib/observability";

export class UpdateEntryUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      entryRepo: WorkJournalEntryRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(id: string, userId: string, data: UpdateEntryInput): Promise<WorkJournalEntry> {
    if (data.context_id) {
      const context = await this.deps.contextRepo.getById(data.context_id, userId);
      if (!context) throw new ContextNotFoundError(data.context_id);
    }

    const entry = await this.deps.entryRepo.update(id, userId, data);
    if (!entry) throw new EntryNotFoundError(id);

    const requestId = createRequestId("wj-entry");
    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_entry_update",
      status: "success",
      metadata: { entryId: id, fields: Object.keys(data) },
    });

    return entry;
  }
}
