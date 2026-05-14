import type { UserId } from "@/modules/shared";
import type { CVDocument } from "../entities/cv-document.entity";
import type { CVDocumentId } from "../value-objects/cv-document-id.value-object";

export interface CVDocumentSearchCriteria {
  userId: UserId;
}

export interface CVDocumentRepository {
  search(criteria: CVDocumentSearchCriteria): Promise<CVDocument[]>;
  findById(id: CVDocumentId, userId: UserId): Promise<CVDocument | null>;
  findPublishedByPublicId(publicId: string): Promise<CVDocument | null>;
  save(document: CVDocument): Promise<CVDocument>;
  delete(id: CVDocumentId, userId: UserId): Promise<void>;
  deleteStoredPdf(path: string): Promise<void>;
}
