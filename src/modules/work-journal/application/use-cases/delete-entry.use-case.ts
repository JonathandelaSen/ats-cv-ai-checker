import { UserId } from "@/modules/shared";
import type { WorkJournalEntryRepository } from "../../domain/repositories/work-journal-entry.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { EntryNotFoundError } from "../../domain/errors/entry-not-found.error";
import { createRequestId } from "@/lib/observability";
import { WorkJournalEntryId } from "../../domain/value-objects/work-journal-entry-id.value-object";

export class DeleteEntryUseCase {
  constructor(
    private readonly deps: {
      entryRepo: WorkJournalEntryRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const entryId = WorkJournalEntryId.fromPrimitives(id);
    const ownerId = UserId.fromPrimitives(userId);
    const entry = await this.deps.entryRepo.findById(entryId, ownerId);
    if (!entry) throw new EntryNotFoundError(id);

    entry.delete();
    await this.deps.entryRepo.delete(entryId, ownerId);

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
