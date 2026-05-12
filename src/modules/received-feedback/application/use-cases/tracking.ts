import { createRequestId } from "@/lib/observability";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";

export async function recordReceivedFeedbackEvent(
  tracker: EventTracker,
  input: {
    userId: string;
    stage: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await tracker.record({
    userId: input.userId,
    requestId: createRequestId("received-feedback"),
    stage: input.stage,
    status: "success",
    metadata: input.metadata,
  });
}
