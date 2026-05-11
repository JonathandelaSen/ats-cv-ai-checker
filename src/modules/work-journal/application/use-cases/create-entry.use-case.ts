import type { WorkJournalEntry } from "../../domain/entities/journal-entry.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type {
  CreateEntryInput,
  WorkJournalEntryRepository,
} from "../../domain/repositories/work-journal-entry.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { ContextArchivedError } from "../../domain/errors/context-archived.error";
import { createRequestId } from "@/lib/observability";

export class CreateEntryUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      entryRepo: WorkJournalEntryRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: CreateEntryInput): Promise<WorkJournalEntry> {
    const context = await this.deps.contextRepo.getById(input.context_id, input.user_id);
    if (!context) throw new ContextNotFoundError(input.context_id);
    if (context.status !== "active") throw new ContextArchivedError(input.context_id);

    await this.deps.contextRepo.update(input.context_id, input.user_id, {
      is_default: true,
    });

    const requestId = createRequestId("wj-entry");
    await this.deps.tracker.record({
      userId: input.user_id,
      requestId,
      stage: "work_journal_entry_create",
      status: "started",
    });

    const entry = await this.deps.entryRepo.create(input);

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
