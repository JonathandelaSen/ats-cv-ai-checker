import { Timestamp, UserId, type EventTracker } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import type { FollowUp } from "../../domain/entities/follow-up.entity";
import type { FollowUpRepository } from "../../domain/repositories/follow-up.repository";
import { FollowUpStatus } from "../../domain/value-objects/follow-up-status.value-object";

export interface UpdateFollowUpByAnalysisInput {
  analysisId: string;
  userId: string;
  status?: string;
  notes?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  requestId?: string;
}

export class UpdateFollowUpByAnalysisUseCase {
  constructor(
    private readonly deps: {
      followUpRepo: FollowUpRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: UpdateFollowUpByAnalysisInput): Promise<FollowUp | null> {
    const userId = UserId.fromPrimitives(input.userId);
    const followUp = await this.deps.followUpRepo.findBySourceJobMatchAnalysisId(
      input.analysisId,
      userId
    );
    if (!followUp) return null;

    const primitives = followUp.toPrimitives();
    followUp.update({
      status: FollowUpStatus.fromPrimitives(input.status ?? primitives.status),
      notes: input.notes === undefined ? primitives.notes : input.notes,
      nextAction:
        input.nextAction === undefined ? primitives.nextAction : input.nextAction,
      nextActionAt:
        input.nextActionAt === undefined
          ? primitives.nextActionAt
          : input.nextActionAt,
      updatedAt: Timestamp.fromPrimitives(new Date().toISOString()),
    });

    const saved = await this.deps.followUpRepo.save(followUp);
    await this.deps.tracker.record({
      userId: input.userId,
      requestId: input.requestId ?? createRequestId("follow-up"),
      stage: "selection_process_follow_up_updated",
      status: "success",
      source: "selection_process",
      analysisId: input.analysisId,
      metadata: { followUpId: saved.id },
    });
    return saved;
  }
}
