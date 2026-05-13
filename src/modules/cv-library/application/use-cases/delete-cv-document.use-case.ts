import { UserId, type EventTracker } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import type {
  CVAnalysisUsageSummary,
  CVDocumentRepository,
} from "../../domain/repositories/cv-document.repository";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";

export type DeleteCVDocumentResult =
  | { status: "deleted" }
  | { status: "in_use"; analyses: CVAnalysisUsageSummary[] }
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
      tracker: EventTracker;
    }
  ) {}

  async execute(input: DeleteCVDocumentInput): Promise<DeleteCVDocumentResult> {
    const id = CVDocumentId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const document = await this.deps.documentRepo.findById(id, userId);
    if (!document) return { status: "not_found" };

    if (document.type === "uploaded") {
      const analyses = await this.deps.documentRepo.listAnalysisUsage(id, userId);
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
