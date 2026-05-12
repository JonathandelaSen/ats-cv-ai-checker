import { AggregateRoot, EntityId, UserId } from "@/modules/shared";
import { CommitmentDomainEvent } from "../events/commitment-domain.event";

export type CommitmentSource = "manager" | "self" | "company" | "project" | "other";
export type CommitmentStatus = "active" | "paused" | "achieved" | "missed" | "cancelled";
export type CommitmentPriority = "low" | "medium" | "high";

export interface CommitmentPrimitives {
  id: string;
  userId: string;
  contextId: string;
  title: string;
  description: string | null;
  successCriteria: string | null;
  resultNotes: string | null;
  source: CommitmentSource;
  status: CommitmentStatus;
  priority: CommitmentPriority | null;
  startDate: string;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommitmentCreateParams {
  id: EntityId;
  userId: UserId;
  contextId: EntityId;
  title: string;
  description?: string | null;
  successCriteria?: string | null;
  resultNotes?: string | null;
  source: CommitmentSource;
  status?: CommitmentStatus;
  priority?: CommitmentPriority | null;
  startDate: string;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class Commitment extends AggregateRoot {
  private constructor(private state: CommitmentPrimitives) {
    super();
  }

  static create(params: CommitmentCreateParams): Commitment {
    validateDateRange(params.startDate, params.targetDate ?? null);
    const commitment = new Commitment({
      id: params.id.toPrimitives(),
      userId: params.userId.toPrimitives(),
      contextId: params.contextId.toPrimitives(),
      title: assertText(params.title, "Objective title", 160),
      description: normalizeText(params.description ?? null, 10000),
      successCriteria: normalizeText(params.successCriteria ?? null, 10000),
      resultNotes: normalizeText(params.resultNotes ?? null, 10000),
      source: assertOneOf(params.source, ["manager", "self", "company", "project", "other"], "source"),
      status: params.status ?? "active",
      priority: params.priority ?? null,
      startDate: params.startDate,
      targetDate: params.targetDate ?? null,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
    commitment.recordDomainEvent(new CommitmentDomainEvent("commitment_created", { commitmentId: commitment.id }));
    return commitment;
  }

  static fromPrimitives(primitives: CommitmentPrimitives): Commitment {
    return new Commitment({ ...primitives });
  }

  get id(): string {
    return this.state.id;
  }

  update(input: Partial<Omit<CommitmentPrimitives, "id" | "userId" | "createdAt">> & { updatedAt: string }): void {
    const nextStartDate = input.startDate ?? this.state.startDate;
    const nextTargetDate = input.targetDate === undefined ? this.state.targetDate : input.targetDate;
    validateDateRange(nextStartDate, nextTargetDate);
    if (input.contextId !== undefined) this.state.contextId = input.contextId;
    if (input.title !== undefined) this.state.title = assertText(input.title, "Objective title", 160);
    if (input.description !== undefined) this.state.description = normalizeText(input.description, 10000);
    if (input.successCriteria !== undefined) this.state.successCriteria = normalizeText(input.successCriteria, 10000);
    if (input.resultNotes !== undefined) this.state.resultNotes = normalizeText(input.resultNotes, 10000);
    if (input.source !== undefined) this.state.source = input.source;
    if (input.status !== undefined) this.state.status = input.status;
    if (input.priority !== undefined) this.state.priority = input.priority;
    if (input.startDate !== undefined) this.state.startDate = input.startDate;
    if (input.targetDate !== undefined) this.state.targetDate = input.targetDate;
    this.state.updatedAt = input.updatedAt;
    this.recordDomainEvent(new CommitmentDomainEvent("commitment_updated", { commitmentId: this.id }));
  }

  delete(): void {
    this.recordDomainEvent(new CommitmentDomainEvent("commitment_deleted", { commitmentId: this.id }));
  }

  toPrimitives(): CommitmentPrimitives {
    return { ...this.state };
  }
}

function assertText(value: string, label: string, max: number): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} cannot be empty.`);
  if (normalized.length > max) throw new Error(`${label} is too long.`);
  return normalized;
}

function normalizeText(value: string | null, max: number): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > max) throw new Error("Text is too long.");
  return normalized;
}

function validateDateRange(startDate: string, targetDate: string | null): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error("Invalid start date.");
  if (targetDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) throw new Error("Invalid target date.");
  if (targetDate !== null && targetDate < startDate) throw new Error("Target date cannot be before start date.");
}

function assertOneOf<T extends string>(value: T, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value)) throw new Error(`Invalid ${label}.`);
  return value;
}
