import { UserId } from "@/modules/shared";
import { JobMatchAnalysis } from "../../domain/entities/job-match-analysis.entity";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import { JobMatchAnalysisId } from "../../domain/value-objects/job-match-analysis-id.value-object";

export interface UpdateJobMatchAnalysisAIResultInput {
  id: string;
  userId: string;
  aiModel: string;
  jobDescription: string | null;
  jobUrl: string | null;
  score: number;
  feedback: string;
  aiKeywords: string[];
  improvements: string[];
  jobKeyData: unknown | null;
  jobKeywords: string[];
  cvKeywords: string[];
  matchingKeywords: string[];
  missingKeywords: string[];
}

export class UpdateJobMatchAnalysisAIResultUseCase {
  constructor(private readonly deps: { repo: JobMatchAnalysisRepository }) {}

  async execute(
    input: UpdateJobMatchAnalysisAIResultInput,
  ): Promise<JobMatchAnalysis | null> {
    const id = JobMatchAnalysisId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const current = await this.deps.repo.findById(id, userId);
    if (!current) return null;

    const now = new Date().toISOString();
    const primitives = current.toPrimitives();
    return this.deps.repo.save(
      JobMatchAnalysis.fromPrimitives({
        ...primitives,
        aiModel: input.aiModel,
        score: input.score,
        feedback: input.feedback,
        aiKeywords: input.aiKeywords,
        improvements: input.improvements,
        jobSnapshot: {
          description: input.jobDescription,
          url: input.jobUrl,
          keyData: input.jobKeyData,
        },
        jobKeywords: input.jobKeywords,
        cvKeywords: input.cvKeywords,
        matchingKeywords: input.matchingKeywords,
        missingKeywords: input.missingKeywords,
        analyzedAt: now,
        updatedAt: now,
      }),
    );
  }
}
