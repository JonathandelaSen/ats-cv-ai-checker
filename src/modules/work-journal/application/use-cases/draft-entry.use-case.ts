import type { AIProvider } from "@/modules/shared";
import type {
  DraftEntryInput,
  JournalAIServiceFactory,
} from "../../domain/repositories/journal-ai-service.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { createRequestId } from "@/lib/observability";

export class DraftEntryUseCase {
  constructor(
    private readonly deps: {
      aiFactory: JournalAIServiceFactory;
      tracker: EventTracker;
    }
  ) {}

  async execute(
    userId: string,
    contextId: string,
    input: DraftEntryInput & {
      provider: AIProvider;
      apiKey?: string;
      model: string;
    }
  ): Promise<string> {
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
