import { AggregateRoot, EntityId, UserId } from "@/modules/shared";
import { CommitmentDomainEvent } from "../events/commitment-domain.event";

export type CommitmentContextType = "employment" | "project" | "personal" | "other";
export type CommitmentContextStatus = "active" | "archived";

export interface CommitmentContextPrimitives {
  id: string;
  userId: string;
  type: CommitmentContextType;
  name: string;
  roleOrLabel: string | null;
  status: CommitmentContextStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommitmentContextCreateParams {
  id: EntityId;
  userId: UserId;
  type: CommitmentContextType;
  name: string;
  roleOrLabel?: string | null;
  status?: CommitmentContextStatus;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export class CommitmentContext extends AggregateRoot {
  private constructor(private state: CommitmentContextPrimitives) {
    super();
  }

  static create(params: CommitmentContextCreateParams): CommitmentContext {
    const context = new CommitmentContext({
      id: params.id.toPrimitives(),
      userId: params.userId.toPrimitives(),
      type: assertContextType(params.type),
      name: assertText(params.name, "Context name", 160),
      roleOrLabel: normalizeText(params.roleOrLabel ?? null, 160),
      status: params.status ?? "active",
      isDefault: params.isDefault ?? false,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
    context.recordDomainEvent(new CommitmentDomainEvent("commitment_context_created", { contextId: context.id }));
    return context;
  }

  static fromPrimitives(primitives: CommitmentContextPrimitives): CommitmentContext {
    return new CommitmentContext({ ...primitives });
  }

  get id(): string {
    return this.state.id;
  }

  update(input: Partial<Pick<CommitmentContextPrimitives, "type" | "name" | "roleOrLabel" | "status">> & { updatedAt: string }): void {
    if (input.type) this.state.type = assertContextType(input.type);
    if (input.name !== undefined) this.state.name = assertText(input.name, "Context name", 160);
    if (input.roleOrLabel !== undefined) this.state.roleOrLabel = normalizeText(input.roleOrLabel, 160);
    if (input.status) this.state.status = input.status;
    this.state.updatedAt = input.updatedAt;
    this.recordDomainEvent(new CommitmentDomainEvent("commitment_context_updated", { contextId: this.id }));
  }

  archive(updatedAt: string): void {
    this.state.status = "archived";
    this.state.isDefault = false;
    this.state.updatedAt = updatedAt;
    this.recordDomainEvent(new CommitmentDomainEvent("commitment_context_archived", { contextId: this.id }));
  }

  toPrimitives(): CommitmentContextPrimitives {
    return { ...this.state };
  }
}

function assertContextType(value: CommitmentContextType): CommitmentContextType {
  if (!["employment", "project", "personal", "other"].includes(value)) {
    throw new Error("Invalid commitment context type.");
  }
  return value;
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
