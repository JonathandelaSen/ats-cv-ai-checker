import { Timestamp, UserId, type EventTracker } from "@/modules/shared";
import { createRequestId } from "@/lib/observability";
import type { CVDocument } from "../../domain/entities/cv-document.entity";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";

export interface UpdateCVDocumentPublicSettingsInput {
  id: string;
  userId: string;
  publicEnabled: boolean;
  publicId: string | null;
  publicSlug: string | null;
  requestId?: string;
}

export class UpdateCVDocumentPublicSettingsUseCase {
  constructor(
    private readonly deps: {
      documentRepo: CVDocumentRepository;
      tracker: EventTracker;
    }
  ) {}

  async execute(
    input: UpdateCVDocumentPublicSettingsInput
  ): Promise<CVDocument | null> {
    const id = CVDocumentId.fromPrimitives(input.id);
    const userId = UserId.fromPrimitives(input.userId);
    const document = await this.deps.documentRepo.findById(id, userId);
    if (!document || document.type !== "template") return null;

    document.updatePublicSettings({
      enabled: input.publicEnabled,
      publicId: input.publicId,
      slug: input.publicSlug,
      publishedAt: input.publicEnabled
        ? Timestamp.fromPrimitives(new Date().toISOString())
        : null,
    });
    const saved = await this.deps.documentRepo.save(document);
    await this.deps.tracker.record({
      userId: input.userId,
      requestId: input.requestId ?? createRequestId("cv-public"),
      stage: "cv_library_public_settings_updated",
      status: "success",
      source: "cv_library",
      cvId: saved.id,
      metadata: { publicEnabled: input.publicEnabled },
    });
    return saved;
  }
}
