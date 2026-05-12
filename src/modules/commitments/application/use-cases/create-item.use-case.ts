import { EntityId, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { CommitmentItem, type CommitmentItemStatus } from "../../domain/entities/commitment-item.entity";
import type { CommitmentItemRepository } from "../../domain/repositories/commitment-item.repository";
import { recordCommitmentEvent } from "./tracking";

export interface CreateCommitmentItemInput {
  userId: string;
  commitmentId: string;
  title: string;
  notes?: string | null;
  evidenceNotes?: string | null;
  status?: CommitmentItemStatus;
  dueDate?: string | null;
  orderIndex?: number;
}

export class CreateCommitmentItemUseCase {
  constructor(private readonly deps: { itemRepo: CommitmentItemRepository; tracker: EventTracker }) {}

  async execute(input: CreateCommitmentItemInput): Promise<CommitmentItem> {
    const now = new Date().toISOString();
    const item = await this.deps.itemRepo.save(
      CommitmentItem.create({
        id: EntityId.fromPrimitives(crypto.randomUUID()),
        userId: UserId.fromPrimitives(input.userId),
        commitmentId: EntityId.fromPrimitives(input.commitmentId),
        title: input.title,
        notes: input.notes,
        evidenceNotes: input.evidenceNotes,
        status: input.status,
        dueDate: input.dueDate,
        orderIndex: input.orderIndex ?? 0,
        createdAt: now,
        updatedAt: now,
      })
    );
    await recordCommitmentEvent(this.deps.tracker, {
      userId: input.userId,
      stage: "commitment_item_created",
      metadata: { commitmentId: input.commitmentId, itemId: item.id, status: input.status ?? "todo" },
    });
    return item;
  }
}
