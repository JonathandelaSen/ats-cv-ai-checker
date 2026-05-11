import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type {
  DraftEntryInput,
  JournalAIService,
} from "../../domain/repositories/journal-ai-service.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { createRequestId } from "@/lib/observability";

export class DraftEntryUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      aiService: JournalAIService;
      tracker: EventTracker;
    }
  ) {}

  async execute(
    userId: string,
    contextId: string,
    input: Omit<DraftEntryInput, "context">
  ): Promise<string> {
    const context = await this.deps.contextRepo.getById(contextId, userId);
    if (!context) throw new ContextNotFoundError(contextId);

    const requestId = createRequestId("wj-draft");
    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_entry_draft",
      status: "started",
      metadata: { contextId },
    });

    const finalText = await this.deps.aiService.draftEntry({
      context,
      ...input,
    });

    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_entry_draft",
      status: "success",
      metadata: { contextId },
    });

    return finalText;
  }
}
