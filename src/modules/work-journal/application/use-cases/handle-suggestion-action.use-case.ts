import type { ContextType, WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { createRequestId } from "@/lib/observability";

interface HandleSuggestionInput {
  userId: string;
  action: "promote" | "hide";
  type: ContextType;
  name: string;
  role_or_label: string | null;
  is_default?: boolean;
}

export class HandleSuggestionActionUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(
    input: HandleSuggestionInput
  ): Promise<{ ok: true } | WorkJournalContext> {
    if (input.action === "hide") {
      await this.deps.contextRepo.hideSuggestion(input.userId, {
        type: input.type,
        name: input.name,
      });

      const requestId = createRequestId("wj-sug");
      await this.deps.tracker.record({
        userId: input.userId,
        requestId,
        stage: "work_journal_suggestion_hide",
        status: "success",
        metadata: { type: input.type, name: input.name },
      });

      return { ok: true };
    }

    const requestId = createRequestId("wj-sug");
    await this.deps.tracker.record({
      userId: input.userId,
      requestId,
      stage: "work_journal_suggestion_promote",
      status: "started",
    });

    const context = await this.deps.contextRepo.create({
      user_id: input.userId,
      type: input.type,
      name: input.name,
      role_or_label: input.role_or_label,
      is_default: input.is_default ?? false,
      created_from_cv: true,
    });

    await this.deps.tracker.record({
      userId: input.userId,
      requestId,
      stage: "work_journal_suggestion_promote",
      status: "success",
      metadata: { contextId: context.id },
    });

    return context;
  }
}
