import { UserId, type AIProvider } from "@/modules/shared";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type {
  DraftEntryInput,
  JournalAIServiceFactory,
} from "../../domain/repositories/journal-ai-service.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { createRequestId } from "@/lib/observability";
import { WorkJournalContextId } from "../../domain/value-objects/work-journal-context-id.value-object";

export class DraftEntryUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      aiFactory: JournalAIServiceFactory;
      tracker: EventTracker;
    }
  ) {}

  async execute(
    userId: string,
    contextId: string,
    input: Omit<DraftEntryInput, "context"> & {
      provider: AIProvider;
      apiKey?: string;
      model: string;
    }
  ): Promise<string> {
    const context = await this.deps.contextRepo.findById(
      WorkJournalContextId.fromPrimitives(contextId),
      UserId.fromPrimitives(userId)
    );
    if (!context) throw new ContextNotFoundError(contextId);

    const requestId = createRequestId("wj-draft");
    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_entry_draft",
      status: "started",
      metadata: { contextId, provider: input.provider, model: input.model },
    });

    const { provider, apiKey, model, ...draftInput } = input;
    const aiService = this.deps.aiFactory.create({
      provider,
      apiKey,
      model,
    });
    const finalText = await aiService.draftEntry({
      context,
      ...draftInput,
    });

    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_entry_draft",
      status: "success",
      metadata: { contextId, provider: input.provider, model: input.model },
    });

    return finalText;
  }
}
