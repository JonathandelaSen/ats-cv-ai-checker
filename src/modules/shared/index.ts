export type { EventTracker, ProcessingEventInput } from "./domain/repositories/event-tracker.repository";
export { AggregateRoot } from "./domain/entities/aggregate-root";
export type { DomainEvent } from "./domain/events/domain-event";
export { UserId } from "./domain/value-objects/user-id.value-object";
export { ValueObject } from "./domain/value-objects/value-object";
export { SupabaseEventTracker } from "./infrastructure/repositories/supabase-event-tracker.repository";
export { handleDomainError } from "./infrastructure/http/domain-error-handler";
