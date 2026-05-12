import type { UserId, EntityId } from "@/modules/shared";
import type { CommitmentContext } from "../entities/commitment-context.entity";

export interface CommitmentContextRepository {
  search(userId: UserId): Promise<CommitmentContext[]>;
  findById(id: EntityId, userId: UserId): Promise<CommitmentContext | null>;
  findDefault(userId: UserId): Promise<CommitmentContext | null>;
  save(context: CommitmentContext): Promise<CommitmentContext>;
  delete(id: EntityId, userId: UserId): Promise<void>;
}
