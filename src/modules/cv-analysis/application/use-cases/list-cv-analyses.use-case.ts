import { UserId } from "@/modules/shared";
import type { CVAnalysis } from "../../domain/entities/cv-analysis.entity";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";

export class ListCVAnalysesUseCase {
  constructor(private readonly deps: { repo: CVAnalysisRepository }) {}

  async execute(input: { userId: string }): Promise<CVAnalysis[]> {
    return this.deps.repo.search(UserId.fromPrimitives(input.userId));
  }
}
