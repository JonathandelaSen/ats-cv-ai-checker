import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentNotFoundError } from "../../domain/errors/commitment-not-found.error";
import type { CommitmentRepository } from "../../domain/repositories/commitment.repository";
import { recordCommitmentEvent } from "./tracking";

export class DeleteCommitmentUseCase {
  constructor(private readonly deps: { commitmentRepo: CommitmentRepository; tracker: EventTracker }) {}

  async execute(input: { userId: string; id: string }): Promise<void> {
    const userId = UserId.fromPrimitives(input.userId);
    const id = EntityId.fromPrimitives(input.id);
    const commitment = await this.deps.commitmentRepo.findById(id, userId);
    if (!commitment) throw new CommitmentNotFoundError();
    commitment.delete();
    await this.deps.commitmentRepo.delete(id, userId);
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_deleted",
      metadata: { commitmentId: input.id },
    });
  }
}
