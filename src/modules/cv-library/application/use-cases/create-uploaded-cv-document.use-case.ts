import { Timestamp, UserId, type EventTracker } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import { CVDocument } from "../../domain/entities/cv-document.entity";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";
import { CVDocumentName } from "../../domain/value-objects/cv-document-name.value-object";
import { CVDocumentType } from "../../domain/value-objects/cv-document-type.value-object";

export interface CreateUploadedCVDocumentInput {
  id: string;
  userId: string;
  name: string;
  filename: string | null;
  fileSize: number | null;
  pdfStoragePath: string | null;
  textPython: string | null;
  textPdfjs: string | null;
  textNode: string | null;
  extractErrorPython: string | null;
  extractErrorPdfjs: string | null;
  extractErrorNode: string | null;
  requestId?: string;
}

export class CreateUploadedCVDocumentUseCase {
  constructor(
    private readonly deps: {
      documentRepo: CVDocumentRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(input: CreateUploadedCVDocumentInput): Promise<CVDocument> {
    const requestId = input.requestId ?? createRequestId("cv-lib");
    const now = new Date().toISOString();
    const document = CVDocument.create({
      id: CVDocumentId.fromPrimitives(input.id),
      userId: UserId.fromPrimitives(input.userId),
      name: CVDocumentName.fromPrimitives(input.name),
      filename: input.filename,
      fileSize: input.fileSize,
      pdfStoragePath: input.pdfStoragePath,
      type: CVDocumentType.fromPrimitives("uploaded"),
      sourceCvId: null,
      templateId: null,
      templateLocale: null,
      schemaVersion: null,
      sourceTextHash: null,
      aiModel: null,
      profile: null,
      extractedText: {
        textPython: input.textPython,
        textPdfjs: input.textPdfjs,
        textNode: input.textNode,
        extractErrorPython: input.extractErrorPython,
        extractErrorPdfjs: input.extractErrorPdfjs,
        extractErrorNode: input.extractErrorNode,
      },
      publicSettings: {
        enabled: false,
        publicId: null,
        slug: null,
        publishedAt: null,
      },
      createdAt: Timestamp.fromPrimitives(now),
      updatedAt: Timestamp.fromPrimitives(now),
    });

    const saved = await this.deps.documentRepo.save(document);
    await this.deps.tracker.record({
      userId: input.userId,
      requestId,
      stage: "cv_library_document_created",
      status: "success",
      source: "cv_library",
      cvId: saved.id,
      metadata: { type: saved.type },
    });
    return saved;
  }
}
