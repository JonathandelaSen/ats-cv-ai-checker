import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentItemNotFoundError } from "../../domain/errors/commitment-item-not-found.error";
import type { CommitmentItemRepository } from "../../domain/repositories/commitment-item.repository";
import { recordCommitmentEvent } from "./tracking";

export class DeleteCommitmentItemUseCase {
  constructor(private readonly deps: { itemRepo: CommitmentItemRepository; tracker: EventTracker }) {}

  async execute(input: { userId: string; id: string }): Promise<void> {
    const userId = UserId.fromPrimitives(input.userId);
    const id = EntityId.fromPrimitives(input.id);
    const item = await this.deps.itemRepo.findById(id, userId);
    if (!item) throw new CommitmentItemNotFoundError();
    item.delete();
    await this.deps.itemRepo.delete(id, userId);
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_item_deleted",
      metadata: { itemId: input.id },
    });
  }
}
