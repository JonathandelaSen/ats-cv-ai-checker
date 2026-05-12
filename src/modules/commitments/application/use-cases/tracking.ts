import { createRequestId } from "@/lib/observability";
import type { EventTracker } from "@/modules/shared/domain/repositories/event-tracker.repository";

export async function recordCommitmentEvent(
  tracker: EventTracker,
  input: {
    userId: string;
    stage: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await tracker.record({
    userId: input.userId,
    requestId: createRequestId("commitments"),
    stage: input.stage,
    status: "success",
    metadata: input.metadata,
  });
}
