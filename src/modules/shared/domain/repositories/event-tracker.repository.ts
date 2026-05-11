import type { ProcessingEventInput } from "@/lib/observability";

export type { ProcessingEventInput };

export interface EventTracker {
  record(event: ProcessingEventInput): Promise<void>;
}
