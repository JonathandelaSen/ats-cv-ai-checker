import {
  AggregateRoot,
  Timestamp,
  UserId,
  type UserId as UserIdType,
} from "@/modules/shared";
import { JobMatchAnalysisId } from "../value-objects/job-match-analysis-id.value-object";

export interface JobMatchAnalysisExtractedTextPrimitives {
  textPython: string | null;
  textPdfjs: string | null;
  textNode: string | null;
  extractErrorPython: string | null;
  extractErrorPdfjs: string | null;
  extractErrorNode: string | null;
}

export interface JobMatchAnalysisPrimitives {
  id: string;
  userId: string;
  cvDocumentId: string | null;
  cvStructuredProfileId: string | null;
  jobOpportunityId: string | null;
  title: string;
  filename: string;
  fileSize: number | null;
  pdfStoragePath: string | null;
  extractedText: JobMatchAnalysisExtractedTextPrimitives;
  aiModel: string | null;
  score: number | null;
  feedback: string | null;
  aiKeywords: string[];
  improvements: string[];
  jobSnapshot: unknown | null;
  jobKeywords: string[];
  cvKeywords: string[];
  matchingKeywords: string[];
  missingKeywords: string[];
  analyzedAt: string | null;
  legacyAnalysisId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobMatchAnalysisCreateParams {
  id: JobMatchAnalysisId;
  userId: UserIdType;
  cvDocumentId: string | null;
  cvStructuredProfileId: string | null;
  jobOpportunityId: string | null;
  title: string;
  filename: string;
  fileSize: number | null;
  pdfStoragePath: string | null;
  extractedText: JobMatchAnalysisExtractedTextPrimitives;
  aiModel: string | null;
  score: number | null;
  feedback: string | null;
  aiKeywords: string[];
  improvements: string[];
  jobSnapshot: unknown | null;
  jobKeywords: string[];
  cvKeywords: string[];
  matchingKeywords: string[];
  missingKeywords: string[];
  analyzedAt: string | null;
  legacyAnalysisId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class JobMatchAnalysis extends AggregateRoot {
  private constructor(
    private readonly analysisId: JobMatchAnalysisId,
    private readonly ownerId: UserIdType,
    private readonly analysisCvDocumentId: string | null,
    private readonly analysisCvStructuredProfileId: string | null,
    private readonly analysisJobOpportunityId: string | null,
    private readonly analysisTitle: string,
    private readonly analysisFilename: string,
    private readonly analysisFileSize: number | null,
    private readonly analysisPdfStoragePath: string | null,
    private readonly analysisExtractedText: JobMatchAnalysisExtractedTextPrimitives,
    private readonly analysisAIModel: string | null,
    private readonly analysisScore: number | null,
    private readonly analysisFeedback: string | null,
    private readonly analysisAIKeywords: string[],
    private readonly analysisImprovements: string[],
    private readonly analysisJobSnapshot: unknown | null,
    private readonly analysisJobKeywords: string[],
    private readonly analysisCVKeywords: string[],
    private readonly analysisMatchingKeywords: string[],
    private readonly analysisMissingKeywords: string[],
    private readonly analysisAnalyzedAt: string | null,
    private readonly analysisLegacyAnalysisId: string | null,
    private readonly analysisCreatedAt: Timestamp,
    private readonly analysisUpdatedAt: Timestamp
  ) {
    super();
  }

  static create(params: JobMatchAnalysisCreateParams): JobMatchAnalysis {
    return new JobMatchAnalysis(
      params.id,
      params.userId,
      params.cvDocumentId,
      params.cvStructuredProfileId,
      params.jobOpportunityId,
      params.title,
      params.filename,
      params.fileSize,
      params.pdfStoragePath,
      params.extractedText,
      params.aiModel,
      params.score,
      params.feedback,
      params.aiKeywords,
      params.improvements,
      params.jobSnapshot,
      params.jobKeywords,
      params.cvKeywords,
      params.matchingKeywords,
      params.missingKeywords,
      params.analyzedAt,
      params.legacyAnalysisId,
      params.createdAt,
      params.updatedAt
    );
  }

  static fromPrimitives(primitives: JobMatchAnalysisPrimitives): JobMatchAnalysis {
    return JobMatchAnalysis.create({
      id: JobMatchAnalysisId.fromPrimitives(primitives.id),
      userId: UserId.fromPrimitives(primitives.userId),
      cvDocumentId: primitives.cvDocumentId,
      cvStructuredProfileId: primitives.cvStructuredProfileId,
      jobOpportunityId: primitives.jobOpportunityId,
      title: primitives.title,
      filename: primitives.filename,
      fileSize: primitives.fileSize,
      pdfStoragePath: primitives.pdfStoragePath,
      extractedText: primitives.extractedText,
      aiModel: primitives.aiModel,
      score: primitives.score,
      feedback: primitives.feedback,
      aiKeywords: primitives.aiKeywords,
      improvements: primitives.improvements,
      jobSnapshot: primitives.jobSnapshot,
      jobKeywords: primitives.jobKeywords,
      cvKeywords: primitives.cvKeywords,
      matchingKeywords: primitives.matchingKeywords,
      missingKeywords: primitives.missingKeywords,
      analyzedAt: primitives.analyzedAt,
      legacyAnalysisId: primitives.legacyAnalysisId,
      createdAt: Timestamp.fromPrimitives(primitives.createdAt),
      updatedAt: Timestamp.fromPrimitives(primitives.updatedAt),
    });
  }

  get id(): string {
    return this.analysisId.toPrimitives();
  }

  toPrimitives(): JobMatchAnalysisPrimitives {
    return {
      id: this.id,
      userId: this.ownerId.toPrimitives(),
      cvDocumentId: this.analysisCvDocumentId,
      cvStructuredProfileId: this.analysisCvStructuredProfileId,
      jobOpportunityId: this.analysisJobOpportunityId,
      title: this.analysisTitle,
      filename: this.analysisFilename,
      fileSize: this.analysisFileSize,
      pdfStoragePath: this.analysisPdfStoragePath,
      extractedText: this.analysisExtractedText,
      aiModel: this.analysisAIModel,
      score: this.analysisScore,
      feedback: this.analysisFeedback,
      aiKeywords: this.analysisAIKeywords,
      improvements: this.analysisImprovements,
      jobSnapshot: this.analysisJobSnapshot,
      jobKeywords: this.analysisJobKeywords,
      cvKeywords: this.analysisCVKeywords,
      matchingKeywords: this.analysisMatchingKeywords,
      missingKeywords: this.analysisMissingKeywords,
      analyzedAt: this.analysisAnalyzedAt,
      legacyAnalysisId: this.analysisLegacyAnalysisId,
      createdAt: this.analysisCreatedAt.toPrimitives(),
      updatedAt: this.analysisUpdatedAt.toPrimitives(),
    };
  }
}
