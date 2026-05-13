import { UserId } from "@/modules/shared";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";
import { CVAnalysisId } from "../../domain/value-objects/cv-analysis-id.value-object";

export class DeleteCVAnalysisUseCase {
  constructor(private readonly deps: { repo: CVAnalysisRepository }) {}

  async execute(input: { id: string; userId: string }): Promise<boolean> {
    return this.deps.repo.delete(
      CVAnalysisId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId),
    );
  }
}
