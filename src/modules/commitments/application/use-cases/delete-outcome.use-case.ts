import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentOutcomeNotFoundError } from "../../domain/errors/commitment-outcome-not-found.error";
import type { CommitmentOutcomeRepository } from "../../domain/repositories/commitment-outcome.repository";
import { recordCommitmentEvent } from "./tracking";

export class DeleteCommitmentOutcomeUseCase {
  constructor(private readonly deps: { outcomeRepo: CommitmentOutcomeRepository; tracker: EventTracker }) {}

  async execute(input: { userId: string; id: string }): Promise<void> {
    const userId = UserId.fromPrimitives(input.userId);
    const id = EntityId.fromPrimitives(input.id);
    const outcome = await this.deps.outcomeRepo.findById(id, userId);
    if (!outcome) throw new CommitmentOutcomeNotFoundError();
    outcome.delete();
    await this.deps.outcomeRepo.delete(id, userId);
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_outcome_deleted",
      metadata: { outcomeId: input.id },
    });
  }
}
