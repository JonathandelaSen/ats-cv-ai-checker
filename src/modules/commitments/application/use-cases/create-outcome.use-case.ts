import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentOutcome, type CommitmentOutcomeStatus, type CommitmentOutcomeType } from "../../domain/entities/commitment-outcome.entity";
import type { CommitmentOutcomeRepository } from "../../domain/repositories/commitment-outcome.repository";
import { recordCommitmentEvent } from "./tracking";

export interface CreateCommitmentOutcomeInput {
  userId: string;
  commitmentId: string;
  type: CommitmentOutcomeType;
  status?: CommitmentOutcomeStatus;
  title: string;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  decidedAt?: string | null;
}

export class CreateCommitmentOutcomeUseCase {
  constructor(private readonly deps: { outcomeRepo: CommitmentOutcomeRepository; tracker: EventTracker }) {}

  async execute(input: CreateCommitmentOutcomeInput): Promise<CommitmentOutcome> {
    const now = new Date().toISOString();
    const outcome = await this.deps.outcomeRepo.save(
      CommitmentOutcome.create({
        id: EntityId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.userId),
        commitmentId: EntityId.fromPrimitives(input.commitmentId),
        type: input.type,
        status: input.status,
        title: input.title,
        description: input.description,
        amount: input.amount,
        currency: input.currency,
        decidedAt: input.decidedAt,
        createdAt: now,
        updatedAt: now,
      })
    );
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_outcome_created",
      metadata: { commitmentId: input.commitmentId, outcomeId: outcome.id, type: input.type, status: input.status ?? "expected" },
    });
    return outcome;
  }
}
