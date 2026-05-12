import { AggregateRoot, EntityId, UserId } from "@/modules/shared";
import { CommitmentDomainEvent } from "../events/commitment-domain.event";

export type CommitmentItemStatus = "todo" | "in_progress" | "done" | "cancelled";

export interface CommitmentItemPrimitives {
  id: string;
  userId: string;
  commitmentId: string;
  title: string;
  notes: string | null;
  evidenceNotes: string | null;
  status: CommitmentItemStatus;
  dueDate: string | null;
  completedAt: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommitmentItemCreateParams {
  id: EntityId;
  userId: UserId;
  commitmentId: EntityId;
  title: string;
  notes?: string | null;
  evidenceNotes?: string | null;
  status?: CommitmentItemStatus;
  dueDate?: string | null;
  completedAt?: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export class CommitmentItem extends AggregateRoot {
  private constructor(private state: CommitmentItemPrimitives) {
    super();
  }

  static create(params: CommitmentItemCreateParams): CommitmentItem {
    const item = new CommitmentItem({
      id: params.id.toPrimitives(),
      userId: params.userId.toPrimitives(),
      commitmentId: params.commitmentId.toPrimitives(),
      title: assertText(params.title, "Item title", 160),
      notes: normalizeText(params.notes ?? null),
      evidenceNotes: normalizeText(params.evidenceNotes ?? null),
      status: params.status ?? "todo",
      dueDate: params.dueDate ?? null,
      completedAt: params.completedAt ?? null,
      orderIndex: params.orderIndex,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
    item.recordDomainEvent(new CommitmentDomainEvent("commitment_item_created", { itemId: item.id }));
    return item;
  }

  static fromPrimitives(primitives: CommitmentItemPrimitives): CommitmentItem {
    return new CommitmentItem({ ...primitives });
  }

  get id(): string {
    return this.state.id;
  }

  update(input: Partial<Omit<CommitmentItemPrimitives, "id" | "userId" | "commitmentId" | "createdAt">> & { updatedAt: string }): void {
    if (input.title !== undefined) this.state.title = assertText(input.title, "Item title", 160);
    if (input.notes !== undefined) this.state.notes = normalizeText(input.notes);
    if (input.evidenceNotes !== undefined) this.state.evidenceNotes = normalizeText(input.evidenceNotes);
    if (input.status !== undefined) this.state.status = input.status;
    if (input.dueDate !== undefined) this.state.dueDate = input.dueDate;
    if (input.completedAt !== undefined) this.state.completedAt = input.completedAt;
    if (input.orderIndex !== undefined) this.state.orderIndex = input.orderIndex;
    this.state.updatedAt = input.updatedAt;
    this.recordDomainEvent(new CommitmentDomainEvent("commitment_item_updated", { itemId: this.id }));
  }

  delete(): void {
    this.recordDomainEvent(new CommitmentDomainEvent("commitment_item_deleted", { itemId: this.id }));
  }

  toPrimitives(): CommitmentItemPrimitives {
    return { ...this.state };
  }
}

function assertText(value: string, label: string, max: number): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} cannot be empty.`);
  if (normalized.length > max) throw new Error(`${label} is too long.`);
  return normalized;
}

function normalizeText(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 10000) throw new Error("Text is too long.");
  return normalized;
}
