export interface DomainEvent<TPrimitives = Record<string, unknown>> {
  readonly eventName: string;
  readonly occurredAt: Date;
  toPrimitives(): TPrimitives;
}
