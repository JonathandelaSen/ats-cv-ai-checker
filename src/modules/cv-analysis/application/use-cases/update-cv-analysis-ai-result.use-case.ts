import { UserId } from "@/modules/shared";
import { CVAnalysis } from "../../domain/entities/cv-analysis.entity";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";
import { CVAnalysisId } from "../../domain/value-objects/cv-analysis-id.value-object";

export interface UpdateCVAnalysisAIResultInput {
  id: string;
  userId: string;
  aiModel: string;
  aiContext: unknown | null;
  score: number;
  feedback: string;
  keywords: string[];
  improvements: string[];
}

export class UpdateCVAnalysisAIResultUseCase {
  constructor(private readonly deps: { repo: CVAnalysisRepository }) {}

  async execute(
    input: UpdateCVAnalysisAIResultInput,
  ): Promise<CVAnalysis | null> {
    const id = CVAnalysisId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const current = await this.deps.repo.findById(id, userId);
    if (!current) return null;

    const now = new Date().toISOString();
    const primitives = current.toPrimitives();
    return this.deps.repo.save(
      CVAnalysis.fromPrimitives({
        ...primitives,
        aiModel: input.aiModel,
        score: input.score,
        feedback: input.feedback,
        keywords: input.keywords,
        improvements: input.improvements,
        aiContext: input.aiContext,
        analyzedAt: now,
        updatedAt: now,
      }),
    );
  }
}
