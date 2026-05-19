import { EntityId, UserId } from "@/modules/shared";
import { ActivityContext, type ActivityContextType } from "../../domain/entities/activity-context.entity";
import type { ActivityContextRepository } from "../../domain/repositories/activity-context.repository";

export interface CreateActivityContextInput {
  userId: string;
  type: ActivityContextType;
  name: string;
}

export class CreateActivityContextUseCase {
  constructor(private readonly deps: { activityContextRepo: ActivityContextRepository }) {}

  async execute(input: CreateActivityContextInput): Promise<ActivityContext> {
    const now = new Date().toISOString();
    return this.deps.activityContextRepo.save(
      ActivityContext.create({
        id: EntityId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.userId),
        type: input.type,
        name: input.name,
        status: "active",
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }
}
