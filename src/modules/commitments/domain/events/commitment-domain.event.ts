import type { DomainEvent } from "@/modules/shared";

export class CommitmentDomainEvent implements DomainEvent {
  readonly occurredAt = new Date();

  constructor(
    readonly eventName: string,
    private readonly payload: Record<string, unknown>
  ) {}

  toPrimitives(): Record<string, unknown> {
    return this.payload;
  }
}
