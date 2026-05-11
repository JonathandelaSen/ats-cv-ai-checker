import { UserId } from "@/modules/shared";
import { WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { createRequestId } from "@/lib/observability";
import {
  type ContextType,
  WorkJournalContextId,
  WorkJournalContextName,
  WorkJournalContextStatus,
  WorkJournalContextType,
  WorkJournalCreatedFromCv,
  WorkJournalIsDefault,
  WorkJournalRoleOrLabel,
  WorkJournalTimestamp,
} from "../../domain/value-objects/work-journal.value-object";

export interface CreateContextInput {
  user_id: string;
  type: ContextType;
  name: string;
  role_or_label?: string | null;
  is_default?: boolean;
  created_from_cv?: boolean;
}

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

    const now = new Date().toISOString();
    const context = await this.deps.contextRepo.save(
      WorkJournalContext.create({
        id: WorkJournalContextId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.user_id),
        type: WorkJournalContextType.fromPrimitives(input.type),
        name: WorkJournalContextName.fromPrimitives(input.name),
        roleOrLabel: WorkJournalRoleOrLabel.fromPrimitives(input.role_or_label ?? null),
        status: WorkJournalContextStatus.fromPrimitives("active"),
        isDefault: WorkJournalIsDefault.fromPrimitives(input.is_default ?? false),
        createdFromCv: WorkJournalCreatedFromCv.fromPrimitives(input.created_from_cv ?? false),
        createdAt: WorkJournalTimestamp.fromPrimitives(now),
        updatedAt: WorkJournalTimestamp.fromPrimitives(now),
      })
    );

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
