import { UserId } from "@/modules/shared";
import type { WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type { WorkJournalContextRepository } from "../../domain/repositories/work-journal-context.repository";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { ContextNotFoundError } from "../../domain/errors/context-not-found.error";
import { createRequestId } from "@/lib/observability";
import {
  type ContextStatus,
  WorkJournalContextId,
  WorkJournalContextName,
  WorkJournalContextStatus,
  WorkJournalIsDefault,
  WorkJournalRoleOrLabel,
} from "../../domain/value-objects/work-journal.value-object";

export interface UpdateContextInput {
  name?: string;
  role_or_label?: string | null;
  status?: ContextStatus;
  is_default?: boolean;
}

export class UpdateContextUseCase {
  constructor(
    private readonly deps: {
      contextRepo: WorkJournalContextRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(id: string, userId: string, data: UpdateContextInput): Promise<WorkJournalContext> {
    const contextId = WorkJournalContextId.fromPrimitives(id);
    const ownerId = UserId.fromPrimitives(userId);
    const context = await this.deps.contextRepo.findById(contextId, ownerId);
    if (!context) throw new ContextNotFoundError(id);
    context.update({
      name: data.name ? WorkJournalContextName.fromPrimitives(data.name) : undefined,
      roleOrLabel:
        data.role_or_label !== undefined
          ? WorkJournalRoleOrLabel.fromPrimitives(data.role_or_label)
          : undefined,
      status: data.status ? WorkJournalContextStatus.fromPrimitives(data.status) : undefined,
      isDefault:
        data.is_default !== undefined
          ? WorkJournalIsDefault.fromPrimitives(data.is_default)
          : undefined,
    });
    const saved = await this.deps.contextRepo.save(context);

    const requestId = createRequestId("wj-ctx");
    await this.deps.tracker.record({
      userId,
      requestId,
      stage: "work_journal_context_update",
      status: "success",
      metadata: { contextId: id, fields: Object.keys(data) },
    });

    return saved;
  }
}
