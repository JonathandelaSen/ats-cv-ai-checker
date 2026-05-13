import { UserId } from "@/modules/shared";
import type { CVAnalysis } from "../../domain/entities/cv-analysis.entity";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";
import { CVAnalysisId } from "../../domain/value-objects/cv-analysis-id.value-object";

export class GetCVAnalysisByIdUseCase {
  constructor(private readonly deps: { repo: CVAnalysisRepository }) {}

  async execute(input: { id: string; userId: string }): Promise<CVAnalysis | null> {
    return this.deps.repo.findById(
      CVAnalysisId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId)
    );
  }
}
