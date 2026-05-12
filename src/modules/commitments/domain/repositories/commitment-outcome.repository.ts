import type { UserId, EntityId } from "@/modules/shared";
import type { CommitmentOutcome } from "../entities/commitment-outcome.entity";

export interface CommitmentOutcomeRepository {
  searchByUser(userId: UserId): Promise<CommitmentOutcome[]>;
  searchByCommitment(commitmentId: EntityId, userId: UserId): Promise<CommitmentOutcome[]>;
  findById(id: EntityId, userId: UserId): Promise<CommitmentOutcome | null>;
  save(outcome: CommitmentOutcome): Promise<CommitmentOutcome>;
  delete(id: EntityId, userId: UserId): Promise<void>;
}
