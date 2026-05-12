import { AggregateRoot, EntityId, UserId } from "@/modules/shared";
import { CommitmentDomainEvent } from "../events/commitment-domain.event";

export type CommitmentOutcomeType =
  | "promotion"
  | "role_change"
  | "leadership"
  | "mentoring"
  | "money"
  | "recognition"
  | "learning"
  | "other";
export type CommitmentOutcomeStatus = "expected" | "achieved" | "missed" | "changed";

export interface CommitmentOutcomePrimitives {
  id: string;
  userId: string;
  commitmentId: string;
  type: CommitmentOutcomeType;
  status: CommitmentOutcomeStatus;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommitmentOutcomeCreateParams {
  id: EntityId;
  userId: UserId;
  commitmentId: EntityId;
  type: CommitmentOutcomeType;
  status?: CommitmentOutcomeStatus;
  title: string;
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class CommitmentOutcome extends AggregateRoot {
  private constructor(private state: CommitmentOutcomePrimitives) {
    super();
  }

  static create(params: CommitmentOutcomeCreateParams): CommitmentOutcome {
    const outcome = new CommitmentOutcome({
      id: params.id.toPrimitives(),
      userId: params.userId.toPrimitives(),
      commitmentId: params.commitmentId.toPrimitives(),
      type: params.type,
      status: params.status ?? "expected",
      title: assertText(params.title, "Outcome title", 160),
      description: normalizeText(params.description ?? null),
      amount: params.amount ?? null,
      currency: normalizeCurrency(params.currency ?? "EUR"),
      decidedAt: params.decidedAt ?? null,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
    outcome.recordDomainEvent(new CommitmentDomainEvent("commitment_outcome_created", { outcomeId: outcome.id }));
    return outcome;
  }

  static fromPrimitives(primitives: CommitmentOutcomePrimitives): CommitmentOutcome {
    return new CommitmentOutcome({ ...primitives });
  }

  get id(): string {
    return this.state.id;
  }

  update(input: Partial<Omit<CommitmentOutcomePrimitives, "id" | "userId" | "commitmentId" | "createdAt">> & { updatedAt: string }): void {
    if (input.type !== undefined) this.state.type = input.type;
    if (input.status !== undefined) this.state.status = input.status;
    if (input.title !== undefined) this.state.title = assertText(input.title, "Outcome title", 160);
    if (input.description !== undefined) this.state.description = normalizeText(input.description);
    if (input.amount !== undefined) this.state.amount = input.amount;
    if (input.currency !== undefined) this.state.currency = normalizeCurrency(input.currency);
    if (input.decidedAt !== undefined) this.state.decidedAt = input.decidedAt;
    this.state.updatedAt = input.updatedAt;
    this.recordDomainEvent(new CommitmentDomainEvent("commitment_outcome_updated", { outcomeId: this.id }));
  }

  delete(): void {
    this.recordDomainEvent(new CommitmentDomainEvent("commitment_outcome_deleted", { outcomeId: this.id }));
  }

  toPrimitives(): CommitmentOutcomePrimitives {
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

function normalizeCurrency(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim().toUpperCase();
  if (!normalized) return null;
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error("Invalid currency.");
  return normalized;
}
