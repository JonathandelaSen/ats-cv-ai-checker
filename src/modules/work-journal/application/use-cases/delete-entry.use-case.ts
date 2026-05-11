import type { WorkJournalEntryRepository } from "../../domain/repositories/work-journal-entry.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { EntryNotFoundError } from "../../domain/errors/entry-not-found.error";
import { createRequestId } from "@/lib/observability";

export class DeleteEntryUseCase {
  constructor(
    private readonly deps: {
      entryRepo: WorkJournalEntryRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const deleted = await this.deps.entryRepo.delete(id, userId);
    if (!deleted) throw new EntryNotFoundError(id);

    const requestId = createRequestId("wj-entry");
    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_entry_delete",
      status: "success",
      metadata: { entryId: id },
    });
  }
}
