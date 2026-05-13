import type { UserId } from "@/modules/shared";
import type { CVAnalysis } from "../entities/cv-analysis.entity";
import type { CVAnalysisId } from "../value-objects/cv-analysis-id.value-object";

export interface CVAnalysisRepository {
  search(userId: UserId): Promise<CVAnalysis[]>;
  findById(id: CVAnalysisId, userId: UserId): Promise<CVAnalysis | null>;
  save(analysis: CVAnalysis): Promise<CVAnalysis>;
  delete(id: CVAnalysisId, userId: UserId): Promise<boolean>;
}
