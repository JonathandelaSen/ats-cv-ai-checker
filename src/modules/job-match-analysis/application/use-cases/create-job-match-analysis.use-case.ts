import { Timestamp, UserId } from "@/modules/shared";
import {
  JobMatchAnalysis,
  type JobMatchAnalysisExtractedTextPrimitives,
} from "../../domain/entities/job-match-analysis.entity";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import { JobMatchAnalysisId } from "../../domain/value-objects/job-match-analysis-id.value-object";

export interface CreateJobMatchAnalysisInput {
  id: string;
  userId: string;
  cvDocumentId: string | null;
  cvStructuredProfileId?: string | null;
  jobOpportunityId?: string | null;
  title: string;
  filename: string;
  fileSize: number | null;
  pdfStoragePath: string | null;
  extractedText: JobMatchAnalysisExtractedTextPrimitives;
  aiModel: string | null;
  jobDescription: string | null;
  jobUrl: string | null;
}

export class CreateJobMatchAnalysisUseCase {
  constructor(private readonly deps: { repo: JobMatchAnalysisRepository }) {}

  async execute(input: CreateJobMatchAnalysisInput): Promise<JobMatchAnalysis> {
    const now = new Date().toISOString();
    return this.deps.repo.save(
      JobMatchAnalysis.create({
        id: JobMatchAnalysisId.fromPrimitives(input.id),
        userId: UserId.fromPrimitives(input.userId),
        cvDocumentId: input.cvDocumentId,
        cvStructuredProfileId: input.cvStructuredProfileId ?? null,
        jobOpportunityId: input.jobOpportunityId ?? null,
        title: input.title,
        filename: input.filename,
        fileSize: input.fileSize,
        pdfStoragePath: input.pdfStoragePath,
        extractedText: input.extractedText,
        aiModel: input.aiModel,
        score: null,
        feedback: null,
        aiKeywords: [],
        improvements: [],
        jobSnapshot: {
          description: input.jobDescription,
          url: input.jobUrl,
          keyData: null,
        },
        jobKeywords: [],
        cvKeywords: [],
        matchingKeywords: [],
        missingKeywords: [],
        analyzedAt: null,
        legacyAnalysisId: null,
        createdAt: Timestamp.fromPrimitives(now),
        updatedAt: Timestamp.fromPrimitives(now),
      }),
    );
  }
}
