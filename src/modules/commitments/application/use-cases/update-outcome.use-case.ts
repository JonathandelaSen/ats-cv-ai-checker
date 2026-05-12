import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentOutcomeNotFoundError } from "../../domain/errors/commitment-outcome-not-found.error";
import type { CommitmentOutcomeStatus, CommitmentOutcomeType } from "../../domain/entities/commitment-outcome.entity";
import type { CommitmentOutcomeRepository } from "../../domain/repositories/commitment-outcome.repository";
import { recordCommitmentEvent } from "./tracking";

export interface UpdateCommitmentOutcomeInput {
  userId: string;
  id: string;
  type?: CommitmentOutcomeType;
  status?: CommitmentOutcomeStatus;
  title?: string;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  decidedAt?: string | null;
}

export class UpdateCommitmentOutcomeUseCase {
  constructor(private readonly deps: { outcomeRepo: CommitmentOutcomeRepository; tracker: EventTracker }) {}

  async execute(input: UpdateCommitmentOutcomeInput) {
    const userId = UserId.fromPrimitives(input.userId);
    const id = EntityId.fromPrimitives(input.id);
    const outcome = await this.deps.outcomeRepo.findById(id, userId);
    if (!outcome) throw new CommitmentOutcomeNotFoundError();
    outcome.update({ ...input, updatedAt: new Date().toISOString() });
    const saved = await this.deps.outcomeRepo.save(outcome);
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_outcome_updated",
      metadata: { outcomeId: input.id, type: input.type ?? null, status: input.status ?? null },
    });
    return saved;
  }
}
