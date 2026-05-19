import { UserId, type AIProvider } from "@/modules/shared";
import { CVAnalysis } from "../../domain/entities/cv-analysis.entity";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";
import type { CVScoringAIServiceFactory } from "../../domain/repositories/cv-scoring-ai.service";
import { CVAnalysisId } from "../../domain/value-objects/cv-analysis-id.value-object";

export interface ScoreCVAnalysisInput {
  id: string;
  userId: string;
  provider: AIProvider;
  apiKey?: string;
  model: string;
  additionalContext?: string | null;
}

export class ScoreCVAnalysisUseCase {
  constructor(
    private readonly deps: {
      repo: CVAnalysisRepository;
      aiServiceFactory: CVScoringAIServiceFactory;
    },
  ) {}

  async execute(input: ScoreCVAnalysisInput): Promise<CVAnalysis | null> {
    const id = CVAnalysisId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const current = await this.deps.repo.findById(id, userId);
    if (!current) return null;

    const primitives = current.toPrimitives();
    const text =
      primitives.extractedText.textPython ||
      primitives.extractedText.textPdfjs ||
      primitives.extractedText.textNode;
    if (!text) {
      throw new Error("No extracted text available for this analysis.");
    }

    const aiService = this.deps.aiServiceFactory.create({
      provider: input.provider,
      apiKey: input.apiKey,
      model: input.model,
    });
    const result = await aiService.score({
      text,
      additionalContext: input.additionalContext,
    });

    const now = new Date().toISOString();
    return this.deps.repo.save(
      CVAnalysis.fromPrimitives({
        ...primitives,
        aiModel: input.model,
        score: result.score,
        feedback: result.feedback,
        keywords: result.keywords,
        improvements: result.improvements,
        aiContext: input.additionalContext
          ? { additionalContext: input.additionalContext }
          : primitives.aiContext,
        analyzedAt: now,
        updatedAt: now,
      }),
    );
  }
}
