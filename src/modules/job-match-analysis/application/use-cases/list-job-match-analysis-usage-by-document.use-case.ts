import { UserId } from "@/modules/shared";
import type { JobMatchAnalysis } from "../../domain/entities/job-match-analysis.entity";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";

export class ListJobMatchAnalysisUsageByDocumentUseCase {
  constructor(private readonly deps: { repo: JobMatchAnalysisRepository }) {}

  async execute(input: {
    cvDocumentId: string;
    userId: string;
  }): Promise<JobMatchAnalysis[]> {
    const analyses = await this.deps.repo.search(UserId.fromPrimitives(input.userId));
    return analyses.filter(
      (analysis) => analysis.toPrimitives().cvDocumentId === input.cvDocumentId,
    );
  }
}
