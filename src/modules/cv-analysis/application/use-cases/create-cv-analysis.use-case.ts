import { Timestamp, UserId } from "@/modules/shared";
import {
  CVAnalysis,
  type CVAnalysisExtractedTextPrimitives,
} from "../../domain/entities/cv-analysis.entity";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";
import { CVAnalysisId } from "../../domain/value-objects/cv-analysis-id.value-object";

export interface CreateCVAnalysisInput {
  id: string;
  userId: string;
  cvDocumentId: string | null;
  cvStructuredProfileId?: string | null;
  title: string;
  filename: string;
  fileSize: number | null;
  pdfStoragePath: string | null;
  extractedText: CVAnalysisExtractedTextPrimitives;
  aiModel: string | null;
  aiContext: unknown | null;
}

export class CreateCVAnalysisUseCase {
  constructor(private readonly deps: { repo: CVAnalysisRepository }) {}

  async execute(input: CreateCVAnalysisInput): Promise<CVAnalysis> {
    const now = new Date().toISOString();
    return this.deps.repo.save(
      CVAnalysis.create({
        id: CVAnalysisId.fromPrimitives(input.id),
        userId: UserId.fromPrimitives(input.userId),
        cvDocumentId: input.cvDocumentId,
        cvStructuredProfileId: input.cvStructuredProfileId ?? null,
        title: input.title,
        filename: input.filename,
        fileSize: input.fileSize,
        pdfStoragePath: input.pdfStoragePath,
        extractedText: input.extractedText,
        aiModel: input.aiModel,
        score: null,
        feedback: null,
        keywords: [],
        improvements: [],
        aiContext: input.aiContext,
        analyzedAt: null,
        legacyAnalysisId: null,
        createdAt: Timestamp.fromPrimitives(now),
        updatedAt: Timestamp.fromPrimitives(now),
      }),
    );
  }
}
