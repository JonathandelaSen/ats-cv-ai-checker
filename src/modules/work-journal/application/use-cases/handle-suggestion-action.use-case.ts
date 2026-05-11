import { Timestamp, UserId } from "@/modules/shared";
import { WorkJournalContext, type ContextType } from "../../domain/entities/journal-context.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { createRequestId } from "@/lib/observability";
import { WorkJournalContextSuggestion } from "../../domain/value-objects/context-suggestion.value-object";
import { WorkJournalContextId } from "../../domain/value-objects/work-journal-context-id.value-object";
import { WorkJournalContextName } from "../../domain/value-objects/work-journal-context-name.value-object";
import { WorkJournalContextStatus } from "../../domain/value-objects/work-journal-context-status.value-object";
import { WorkJournalContextType } from "../../domain/value-objects/work-journal-context-type.value-object";
import { WorkJournalCreatedFromCv } from "../../domain/value-objects/work-journal-created-from-cv.value-object";
import { WorkJournalIsDefault } from "../../domain/value-objects/work-journal-is-default.value-object";
import { WorkJournalRoleOrLabel } from "../../domain/value-objects/work-journal-role-or-label.value-object";

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
      await this.deps.contextRepo.hideSuggestion(
        UserId.fromPrimitives(input.userId),
        WorkJournalContextSuggestion.fromPrimitives({
          type: input.type,
          name: input.name,
          roleOrLabel: input.role_or_label,
          isCurrent: false,
          source: "cv",
        })
      );

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

    const now = new Date().toISOString();
    const context = await this.deps.contextRepo.save(
      WorkJournalContext.create({
        id: WorkJournalContextId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.userId),
        type: WorkJournalContextType.fromPrimitives(input.type),
        name: WorkJournalContextName.fromPrimitives(input.name),
        roleOrLabel: WorkJournalRoleOrLabel.fromPrimitives(input.role_or_label),
        status: WorkJournalContextStatus.fromPrimitives("active"),
        isDefault: WorkJournalIsDefault.fromPrimitives(input.is_default ?? false),
        createdFromCv: WorkJournalCreatedFromCv.fromPrimitives(true),
        createdAt: Timestamp.fromPrimitives(now),
        updatedAt: Timestamp.fromPrimitives(now),
      })
    );

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
