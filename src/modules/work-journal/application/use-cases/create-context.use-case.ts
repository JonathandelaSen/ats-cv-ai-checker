import type { WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type {
  CreateContextInput,
  WorkJournalContextRepository,
} from "../../domain/repositories/work-journal-context.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { createRequestId } from "@/lib/observability";

export class CreateContextUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: CreateContextInput): Promise<WorkJournalContext> {
    const requestId = createRequestId("wj-ctx");
    await this.deps.tracker.record({
      userId: input.user_id,
      requestId,
      stage: "work_journal_context_create",
      status: "started",
    });

    const context = await this.deps.contextRepo.create(input);

    await this.deps.tracker.record({
      userId: input.user_id,
      requestId,
      stage: "work_journal_context_create",
      status: "success",
      metadata: { contextId: context.id, type: context.type },
    });

    return context;
  }
}
