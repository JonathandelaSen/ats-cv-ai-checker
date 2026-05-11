import type { WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type {
  UpdateContextInput,
  WorkJournalContextRepository,
} from "../../domain/repositories/work-journal-context.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { createRequestId } from "@/lib/observability";

export class UpdateContextUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(id: string, userId: string, data: UpdateContextInput): Promise<WorkJournalContext> {
    const context = await this.deps.contextRepo.update(id, userId, data);
    if (!context) throw new ContextNotFoundError(id);

    const requestId = createRequestId("wj-ctx");
    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_context_update",
      status: "success",
      metadata: { contextId: id, fields: Object.keys(data) },
    });

    return context;
  }
}
