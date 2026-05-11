import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";
import { createRequestId } from "@/lib/observability";

export async function recordFeedbackEvent(
  tracker: EventTracker,
  input: {
    userId: string;
    stage: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const requestId = createRequestId("feedback-notes");
  await tracker.record({
    userId: input.userId,
    requestId,
    stage: input.stage,
    status: "success",
    metadata: input.metadata,
  });
}
