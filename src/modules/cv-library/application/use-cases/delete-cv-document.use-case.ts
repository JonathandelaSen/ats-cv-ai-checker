import type { AnalysisSummary } from "@/lib/analysis-types";
import {
  ListCVAnalysisUsageByDocumentQuery,
  type ListCVAnalysisUsageByDocumentResult,
} from "@/modules/cv-analysis";
import { ListJobMatchAnalysisUsageByDocumentQuery } from "@/modules/job-match-analysis";
import { UserId, type EventTracker, type QueryBus } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";

export type DeleteCVDocumentResult =
  | { status: "deleted" }
  | { status: "in_use"; analyses: AnalysisSummary[] }
  | { status: "not_found" };

export interface DeleteCVDocumentInput {
  id: string;
  userId: string;
  requestId?: string;
}

export class DeleteCVDocumentUseCase {
  constructor(
    private readonly deps: {
      documentRepo: CVDocumentRepository;
      queryBus: QueryBus;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: DeleteCVDocumentInput): Promise<DeleteCVDocumentResult> {
    const id = CVDocumentId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const document = await this.deps.documentRepo.findById(id, userId);
    if (!document) return { status: "not_found" };

    if (document.type === "uploaded") {
      const [cvAnalyses, jobMatchAnalyses] = await Promise.all([
        this.deps.queryBus.execute<ListCVAnalysisUsageByDocumentResult[]>(
          new ListCVAnalysisUsageByDocumentQuery({
            cvDocumentId: input.id,
            userId: input.userId,
          }),
        ),
        this.deps.queryBus.execute<ListCVAnalysisUsageByDocumentResult[]>(
          new ListJobMatchAnalysisUsageByDocumentQuery({
            cvDocumentId: input.id,
            userId: input.userId,
          }),
        ),
      ]);
      const analyses = [...cvAnalyses, ...jobMatchAnalyses].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      );
      if (analyses.length > 0) return { status: "in_use", analyses };
    }

    if (document.pdfStoragePath) {
      await this.deps.documentRepo.deleteStoredPdf(document.pdfStoragePath);
    }
    await this.deps.documentRepo.delete(id, userId);
    await this.deps.tracker.record({
      userId: input.userId,
      requestId: input.requestId ?? createRequestId("cv-delete"),
      stage: "cv_library_document_deleted",
      status: "success",
      source: "cv_library",
      cvId: document.id,
    });
    return { status: "deleted" };
  }
}
