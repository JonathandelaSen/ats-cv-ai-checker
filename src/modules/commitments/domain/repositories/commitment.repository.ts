import type { UserId, EntityId } from "@/modules/shared";
import type { Commitment } from "../entities/commitment.entity";

export interface CommitmentRepository {
  search(userId: UserId): Promise<Commitment[]>;
  findById(id: EntityId, userId: UserId): Promise<Commitment | null>;
  save(commitment: Commitment): Promise<Commitment>;
  delete(id: EntityId, userId: UserId): Promise<void>;
}
