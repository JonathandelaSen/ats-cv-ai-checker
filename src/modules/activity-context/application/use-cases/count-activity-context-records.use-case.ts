import { EntityId, UserId } from "@/modules/shared";
import type { ActivityContextRepository } from "../../domain/repositories/activity-context.repository";

export class CountActivityContextRecordsUseCase {
  constructor(private readonly deps: { activityContextRepo: ActivityContextRepository }) {}

  async execute(input: { id: string; userId: string }): Promise<number> {
    return this.deps.activityContextRepo.countAssignedRecords(
      EntityId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId),
    );
  }
}
