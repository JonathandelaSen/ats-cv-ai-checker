import { EntityId, UserId } from "@/modules/shared";
import { ActivityContextNotFoundError } from "../../domain/errors/activity-context-not-found.error";
import type { ActivityContext, ActivityContextStatus, ActivityContextType } from "../../domain/entities/activity-context.entity";
import type { ActivityContextRepository } from "../../domain/repositories/activity-context.repository";

export interface UpdateActivityContextInput {
  id: string;
  userId: string;
  type?: ActivityContextType;
  name?: string;
  status?: ActivityContextStatus;
}

export class UpdateActivityContextUseCase {
  constructor(private readonly deps: { activityContextRepo: ActivityContextRepository }) {}

  async execute(input: UpdateActivityContextInput): Promise<ActivityContext> {
    const id = EntityId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const context = await this.deps.activityContextRepo.findById(id, userId);
    if (!context) throw new ActivityContextNotFoundError();
    context.update({
      type: input.type,
      name: input.name,
      status: input.status,
      updatedAt: new Date().toISOString(),
    });
    return this.deps.activityContextRepo.save(context);
  }
}
