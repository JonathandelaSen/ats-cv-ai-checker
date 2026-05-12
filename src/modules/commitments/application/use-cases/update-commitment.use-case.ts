import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentNotFoundError } from "../../domain/errors/commitment-not-found.error";
import type { CommitmentPriority, CommitmentSource, CommitmentStatus } from "../../domain/entities/commitment.entity";
import type { CommitmentRepository } from "../../domain/repositories/commitment.repository";
import { recordCommitmentEvent } from "./tracking";

export interface UpdateCommitmentInput {
  userId: string;
  id: string;
  contextId?: string;
  title?: string;
  description?: string | null;
  successCriteria?: string | null;
  resultNotes?: string | null;
  source?: CommitmentSource;
  status?: CommitmentStatus;
  priority?: CommitmentPriority | null;
  startDate?: string;
  targetDate?: string | null;
}

export class UpdateCommitmentUseCase {
  constructor(private readonly deps: { commitmentRepo: CommitmentRepository; tracker: EventTracker }) {}

  async execute(input: UpdateCommitmentInput) {
    const userId = UserId.fromPrimitives(input.userId);
    const id = EntityId.fromPrimitives(input.id);
    const commitment = await this.deps.commitmentRepo.findById(id, userId);
    if (!commitment) throw new CommitmentNotFoundError();
    commitment.update({ ...input, updatedAt: new Date().toISOString() });
    const saved = await this.deps.commitmentRepo.save(commitment);
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_updated",
      metadata: { commitmentId: input.id, status: input.status ?? null },
    });
    return saved;
  }
}
