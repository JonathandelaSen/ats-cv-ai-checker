import { EntityId, UserId } from "@/modules/shared";
import { ActivityContextNotFoundError } from "../../domain/errors/activity-context-not-found.error";
import { DefaultActivityContextDeleteError } from "../../domain/errors/default-activity-context-delete.error";
import { DefaultActivityContextMissingError } from "../../domain/errors/default-activity-context-missing.error";
import type { ActivityContextRepository } from "../../domain/repositories/activity-context.repository";

export interface DeleteActivityContextResult {
  reassignedRecords: number;
}

export class DeleteActivityContextUseCase {
  constructor(private readonly deps: { activityContextRepo: ActivityContextRepository }) {}

  async execute(input: { id: string; userId: string }): Promise<DeleteActivityContextResult> {
    const id = EntityId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const context = await this.deps.activityContextRepo.findById(id, userId);
    if (!context) throw new ActivityContextNotFoundError();
    if (context.isDefault) throw new DefaultActivityContextDeleteError();

    const defaultContext = await this.deps.activityContextRepo.findDefault(userId);
    if (!defaultContext) throw new DefaultActivityContextMissingError();
    const reassignedRecords = await this.deps.activityContextRepo.reassignRecordsToDefault({
      userId,
      sourceContextId: id,
      defaultContextId: EntityId.fromPrimitives(defaultContext.id),
    });
    await this.deps.activityContextRepo.delete(id, userId);
    return { reassignedRecords };
  }
}
