import type { UserId, EntityId } from "@/modules/shared";
import type { CommitmentItem } from "../entities/commitment-item.entity";

export interface CommitmentItemRepository {
  searchByUser(userId: UserId): Promise<CommitmentItem[]>;
  searchByCommitment(commitmentId: EntityId, userId: UserId): Promise<CommitmentItem[]>;
  findById(id: EntityId, userId: UserId): Promise<CommitmentItem | null>;
  save(item: CommitmentItem): Promise<CommitmentItem>;
  delete(id: EntityId, userId: UserId): Promise<void>;
}
