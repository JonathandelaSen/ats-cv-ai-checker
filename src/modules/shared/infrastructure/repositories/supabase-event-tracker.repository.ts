import { recordProcessingEvent } from "@/lib/observability";
import type { EventTracker, ProcessingEventInput } from "../../domain/repositories/event-tracker.repository";

export class SupabaseEventTracker implements EventTracker {
  async record(event: ProcessingEventInput): Promise<void> {
    await recordProcessingEvent(event);
  }
}
