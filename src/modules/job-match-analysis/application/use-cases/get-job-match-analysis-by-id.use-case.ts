import { UserId } from "@/modules/shared";
import type { JobMatchAnalysis } from "../../domain/entities/job-match-analysis.entity";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import { JobMatchAnalysisId } from "../../domain/value-objects/job-match-analysis-id.value-object";

export class GetJobMatchAnalysisByIdUseCase {
  constructor(private readonly deps: { repo: JobMatchAnalysisRepository }) {}

  async execute(input: { id: string; userId: string }): Promise<JobMatchAnalysis | null> {
    return this.deps.repo.findById(
      JobMatchAnalysisId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId)
    );
  }
}
