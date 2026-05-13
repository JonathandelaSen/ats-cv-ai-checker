import { UserId } from "@/modules/shared";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import { JobMatchAnalysisId } from "../../domain/value-objects/job-match-analysis-id.value-object";

export class DeleteJobMatchAnalysisUseCase {
  constructor(private readonly deps: { repo: JobMatchAnalysisRepository }) {}

  async execute(input: { id: string; userId: string }): Promise<boolean> {
    return this.deps.repo.delete(
      JobMatchAnalysisId.fromPrimitives(input.id),
      UserId.fromPrimitives(input.userId),
    );
  }
}
