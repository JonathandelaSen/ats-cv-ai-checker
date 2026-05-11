import type { DomainEvent } from "../events/domain-event";

export abstract class AggregateRoot {
  private domainEvents: DomainEvent[] = [];

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  protected recordDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
}
