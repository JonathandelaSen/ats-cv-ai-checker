import { UserId } from "@/modules/shared";
import { JobMatchAnalysis } from "../../domain/entities/job-match-analysis.entity";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import type { JobMatchScoringAIServiceFactory } from "../../domain/repositories/job-match-scoring-ai.service";
import { JobMatchAnalysisId } from "../../domain/value-objects/job-match-analysis-id.value-object";

export interface ScoreJobMatchAnalysisInput {
  id: string;
  userId: string;
  apiKey: string;
  model: string;
  jobDescription: string;
  jobUrl: string | null;
}

export class ScoreJobMatchAnalysisUseCase {
  constructor(
    private readonly deps: {
      repo: JobMatchAnalysisRepository;
      aiServiceFactory: JobMatchScoringAIServiceFactory;
    },
  ) {}

  async execute(
    input: ScoreJobMatchAnalysisInput,
  ): Promise<JobMatchAnalysis | null> {
    const id = JobMatchAnalysisId.fromPrimitives(input.id);
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
      apiKey: input.apiKey,
      model: input.model,
    });
    const result = await aiService.score({
      text,
      jobDescription: input.jobDescription,
      jobUrl: input.jobUrl,
    });

    const now = new Date().toISOString();
    return this.deps.repo.save(
      JobMatchAnalysis.fromPrimitives({
        ...primitives,
        aiModel: input.model,
        score: result.score,
        feedback: result.feedback,
        aiKeywords: result.aiKeywords,
        improvements: result.improvements,
        jobSnapshot: {
          description: input.jobDescription,
          url: input.jobUrl,
          keyData: result.jobKeyData,
        },
        jobKeywords: result.jobKeywords,
        cvKeywords: result.cvKeywords,
        matchingKeywords: result.matchingKeywords,
        missingKeywords: result.missingKeywords,
        analyzedAt: now,
        updatedAt: now,
      }),
    );
  }
}
