import { UserId } from "@/modules/shared";
import { JobMatchAnalysis } from "../../domain/entities/job-match-analysis.entity";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import { JobMatchAnalysisId } from "../../domain/value-objects/job-match-analysis-id.value-object";

export class UpdateJobMatchAnalysisJobUrlUseCase {
  constructor(private readonly deps: { repo: JobMatchAnalysisRepository }) {}

  async execute(input: {
    id: string;
    userId: string;
    jobUrl: string | null;
  }): Promise<JobMatchAnalysis | null> {
    const id = JobMatchAnalysisId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const current = await this.deps.repo.findById(id, userId);
    if (!current) return null;

    const now = new Date().toISOString();
    const primitives = current.toPrimitives();
    const snapshot =
      primitives.jobSnapshot && typeof primitives.jobSnapshot === "object"
        ? { ...(primitives.jobSnapshot as Record<string, unknown>) }
        : {};

    return this.deps.repo.save(
      JobMatchAnalysis.fromPrimitives({
        ...primitives,
        jobSnapshot: { ...snapshot, url: input.jobUrl },
        updatedAt: now,
      }),
    );
  }
}
