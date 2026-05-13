import { Timestamp, UserId, type EventTracker } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import type {
  CVDocument,
  CVDocumentExtractedTextPrimitives,
} from "../../domain/entities/cv-document.entity";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";

export interface UpdateCVDocumentExtractionInput {
  id: string;
  userId: string;
  extractedText: CVDocumentExtractedTextPrimitives;
  requestId?: string;
}

export class UpdateCVDocumentExtractionUseCase {
  constructor(
    private readonly deps: {
      documentRepo: CVDocumentRepository;
      tracker: EventTracker;
    },
  ) {}

  async execute(
    input: UpdateCVDocumentExtractionInput,
  ): Promise<CVDocument | null> {
    const id = CVDocumentId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const document = await this.deps.documentRepo.findById(id, userId);
    if (!document) return null;

    document.updateExtractedText(
      input.extractedText,
      Timestamp.fromPrimitives(new Date().toISOString()),
    );
    const saved = await this.deps.documentRepo.save(document);
    await this.deps.tracker.record({
      userId: input.userId,
      requestId: input.requestId ?? createRequestId("cv-extraction"),
      stage: "cv_library_extraction_updated",
      status: "success",
      source: "cv_library",
      cvId: saved.id,
    });
    return saved;
  }
}
