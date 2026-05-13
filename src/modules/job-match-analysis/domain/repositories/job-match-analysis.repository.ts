import type { UserId } from "@/modules/shared";
import type { JobMatchAnalysis } from "../entities/job-match-analysis.entity";
import type { JobMatchAnalysisId } from "../value-objects/job-match-analysis-id.value-object";

export interface JobMatchAnalysisRepository {
  search(userId: UserId): Promise<JobMatchAnalysis[]>;
  findById(id: JobMatchAnalysisId, userId: UserId): Promise<JobMatchAnalysis | null>;
  save(analysis: JobMatchAnalysis): Promise<JobMatchAnalysis>;
  delete(id: JobMatchAnalysisId, userId: UserId): Promise<boolean>;
}
