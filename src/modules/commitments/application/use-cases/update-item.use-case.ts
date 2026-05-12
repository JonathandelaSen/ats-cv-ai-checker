import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentItemNotFoundError } from "../../domain/errors/commitment-item-not-found.error";
import type { CommitmentItemStatus } from "../../domain/entities/commitment-item.entity";
import type { CommitmentItemRepository } from "../../domain/repositories/commitment-item.repository";
import { recordCommitmentEvent } from "./tracking";

export interface UpdateCommitmentItemInput {
  userId: string;
  id: string;
  title?: string;
  notes?: string | null;
  evidenceNotes?: string | null;
  status?: CommitmentItemStatus;
  dueDate?: string | null;
  completedAt?: string | null;
  orderIndex?: number;
}

export class UpdateCommitmentItemUseCase {
  constructor(private readonly deps: { itemRepo: CommitmentItemRepository; tracker: EventTracker }) {}

  async execute(input: UpdateCommitmentItemInput) {
    const userId = UserId.fromPrimitives(input.userId);
    const id = EntityId.fromPrimitives(input.id);
    const item = await this.deps.itemRepo.findById(id, userId);
    if (!item) throw new CommitmentItemNotFoundError();
    item.update({ ...input, updatedAt: new Date().toISOString() });
    const saved = await this.deps.itemRepo.save(item);
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_item_updated",
      metadata: { itemId: input.id, status: input.status ?? null },
    });
    return saved;
  }
}
