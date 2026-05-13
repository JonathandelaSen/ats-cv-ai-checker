import {
  AggregateRoot,
  Timestamp,
  UserId,
  type UserId as UserIdType,
} from "@/modules/shared";
import { CVAnalysisId } from "../value-objects/cv-analysis-id.value-object";

export interface CVAnalysisExtractedTextPrimitives {
  textPython: string | null;
  textPdfjs: string | null;
  textNode: string | null;
  extractErrorPython: string | null;
  extractErrorPdfjs: string | null;
  extractErrorNode: string | null;
}

export interface CVAnalysisPrimitives {
  id: string;
  userId: string;
  cvDocumentId: string | null;
  cvStructuredProfileId: string | null;
  title: string;
  filename: string;
  fileSize: number | null;
  pdfStoragePath: string | null;
  extractedText: CVAnalysisExtractedTextPrimitives;
  aiModel: string | null;
  score: number | null;
  feedback: string | null;
  keywords: string[];
  improvements: string[];
  aiContext: unknown | null;
  analyzedAt: string | null;
  legacyAnalysisId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CVAnalysisCreateParams {
  id: CVAnalysisId;
  userId: UserIdType;
  cvDocumentId: string | null;
  cvStructuredProfileId: string | null;
  title: string;
  filename: string;
  fileSize: number | null;
  pdfStoragePath: string | null;
  extractedText: CVAnalysisExtractedTextPrimitives;
  aiModel: string | null;
  score: number | null;
  feedback: string | null;
  keywords: string[];
  improvements: string[];
  aiContext: unknown | null;
  analyzedAt: string | null;
  legacyAnalysisId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class CVAnalysis extends AggregateRoot {
  private constructor(
    private readonly analysisId: CVAnalysisId,
    private readonly ownerId: UserIdType,
    private readonly analysisCvDocumentId: string | null,
    private readonly analysisCvStructuredProfileId: string | null,
    private readonly analysisTitle: string,
    private readonly analysisFilename: string,
    private readonly analysisFileSize: number | null,
    private readonly analysisPdfStoragePath: string | null,
    private readonly analysisExtractedText: CVAnalysisExtractedTextPrimitives,
    private readonly analysisAIModel: string | null,
    private readonly analysisScore: number | null,
    private readonly analysisFeedback: string | null,
    private readonly analysisKeywords: string[],
    private readonly analysisImprovements: string[],
    private readonly analysisAIContext: unknown | null,
    private readonly analysisAnalyzedAt: string | null,
    private readonly analysisLegacyAnalysisId: string | null,
    private readonly analysisCreatedAt: Timestamp,
    private readonly analysisUpdatedAt: Timestamp
  ) {
    super();
  }

  static create(params: CVAnalysisCreateParams): CVAnalysis {
    return new CVAnalysis(
      params.id,
      params.userId,
      params.cvDocumentId,
      params.cvStructuredProfileId,
      params.title,
      params.filename,
      params.fileSize,
      params.pdfStoragePath,
      params.extractedText,
      params.aiModel,
      params.score,
      params.feedback,
      params.keywords,
      params.improvements,
      params.aiContext,
      params.analyzedAt,
      params.legacyAnalysisId,
      params.createdAt,
      params.updatedAt
    );
  }

  static fromPrimitives(primitives: CVAnalysisPrimitives): CVAnalysis {
    return CVAnalysis.create({
      id: CVAnalysisId.fromPrimitives(primitives.id),
      userId: UserId.fromPrimitives(primitives.userId),
      cvDocumentId: primitives.cvDocumentId,
      cvStructuredProfileId: primitives.cvStructuredProfileId,
      title: primitives.title,
      filename: primitives.filename,
      fileSize: primitives.fileSize,
      pdfStoragePath: primitives.pdfStoragePath,
      extractedText: primitives.extractedText,
      aiModel: primitives.aiModel,
      score: primitives.score,
      feedback: primitives.feedback,
      keywords: primitives.keywords,
      improvements: primitives.improvements,
      aiContext: primitives.aiContext,
      analyzedAt: primitives.analyzedAt,
      legacyAnalysisId: primitives.legacyAnalysisId,
      createdAt: Timestamp.fromPrimitives(primitives.createdAt),
      updatedAt: Timestamp.fromPrimitives(primitives.updatedAt),
    });
  }

  get id(): string {
    return this.analysisId.toPrimitives();
  }

  toPrimitives(): CVAnalysisPrimitives {
    return {
      id: this.id,
      userId: this.ownerId.toPrimitives(),
      cvDocumentId: this.analysisCvDocumentId,
      cvStructuredProfileId: this.analysisCvStructuredProfileId,
      title: this.analysisTitle,
      filename: this.analysisFilename,
      fileSize: this.analysisFileSize,
      pdfStoragePath: this.analysisPdfStoragePath,
      extractedText: this.analysisExtractedText,
      aiModel: this.analysisAIModel,
      score: this.analysisScore,
      feedback: this.analysisFeedback,
      keywords: this.analysisKeywords,
      improvements: this.analysisImprovements,
      aiContext: this.analysisAIContext,
      analyzedAt: this.analysisAnalyzedAt,
      legacyAnalysisId: this.analysisLegacyAnalysisId,
      createdAt: this.analysisCreatedAt.toPrimitives(),
      updatedAt: this.analysisUpdatedAt.toPrimitives(),
    };
  }
}
