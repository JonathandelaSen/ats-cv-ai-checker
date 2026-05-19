import { UserId } from "@/modules/shared";
import type { ActivityContext } from "../../domain/entities/activity-context.entity";
import type { ActivityContextRepository } from "../../domain/repositories/activity-context.repository";

export class ListActivityContextsUseCase {
  constructor(private readonly deps: { activityContextRepo: ActivityContextRepository }) {}

  async execute(userId: string): Promise<ActivityContext[]> {
    return this.deps.activityContextRepo.search(UserId.fromPrimitives(userId));
  }
}
