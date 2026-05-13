import type { UserId } from "@/modules/shared";
import type { FollowUp } from "../entities/follow-up.entity";

export interface FollowUpRepository {
  findBySourceJobMatchAnalysisId(
    analysisId: string,
    userId: UserId
  ): Promise<FollowUp | null>;
  save(followUp: FollowUp): Promise<FollowUp>;
}
