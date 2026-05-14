import { UserId } from "@/modules/shared";
import type { CVAnalysis } from "../../domain/entities/cv-analysis.entity";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";

export class ListCVAnalysisUsageByDocumentUseCase {
  constructor(private readonly deps: { repo: CVAnalysisRepository }) {}

  async execute(input: {
    cvDocumentId: string;
    userId: string;
  }): Promise<CVAnalysis[]> {
    const analyses = await this.deps.repo.search(UserId.fromPrimitives(input.userId));
    return analyses.filter(
      (analysis) => analysis.toPrimitives().cvDocumentId === input.cvDocumentId,
    );
  }
}
