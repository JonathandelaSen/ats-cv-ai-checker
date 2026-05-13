import { Timestamp, UserId, type EventTracker } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import type { CVDocument } from "../../domain/entities/cv-document.entity";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";
import { CVDocumentName } from "../../domain/value-objects/cv-document-name.value-object";

export interface UpdateCVDocumentNameInput {
  id: string;
  userId: string;
  name: string;
  requestId?: string;
}

export class UpdateCVDocumentNameUseCase {
  constructor(
    private readonly deps: {
      documentRepo: CVDocumentRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: UpdateCVDocumentNameInput): Promise<CVDocument | null> {
    const id = CVDocumentId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const document = await this.deps.documentRepo.findById(id, userId);
    if (!document) return null;

    document.rename(
      CVDocumentName.fromPrimitives(input.name),
      Timestamp.fromPrimitives(new Date().toISOString())
    );
    const saved = await this.deps.documentRepo.save(document);
    await this.deps.tracker.record({
      userId: input.userId,
      requestId: input.requestId ?? createRequestId("cv-rename"),
      stage: "cv_library_document_renamed",
      status: "success",
      source: "cv_library",
      cvId: saved.id,
    });
    return saved;
  }
}
