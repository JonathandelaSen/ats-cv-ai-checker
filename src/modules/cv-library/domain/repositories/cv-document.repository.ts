import type { UserId } from "@/modules/shared";
import type { CVDocument } from "../entities/cv-document.entity";
import type { CVDocumentId } from "../value-objects/cv-document-id.value-object";

export interface CVAnalysisUsageSummary {
  id: string;
  cv_id: string | null;
  title: string;
  filename: string;
  created_at: string;
  analysis_mode: "general" | "job_match";
  ai_score: number | null;
  ai_analyzed_at: string | null;
  job_url: string | null;
  offer_status:
    | "interesante"
    | "aplicado"
    | "entrevista"
    | "oferta"
    | "rechazado"
    | "descartado"
    | null;
  offer_next_action_at: string | null;
}

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
  listAnalysisUsage(
    id: CVDocumentId,
    userId: UserId
  ): Promise<CVAnalysisUsageSummary[]>;
}
