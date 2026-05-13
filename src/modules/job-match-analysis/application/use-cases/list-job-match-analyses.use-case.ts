import { UserId } from "@/modules/shared";
import type { JobMatchAnalysis } from "../../domain/entities/job-match-analysis.entity";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";

export class ListJobMatchAnalysesUseCase {
  constructor(private readonly deps: { repo: JobMatchAnalysisRepository }) {}

  async execute(input: { userId: string }): Promise<JobMatchAnalysis[]> {
    return this.deps.repo.search(UserId.fromPrimitives(input.userId));
  }
}
