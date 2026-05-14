import type { CVDocumentExtractedTextPrimitives } from "../entities/cv-document.entity";
import type { StandardCVProfile } from "../cv-profile";
import type { CVTemplateId, CVTemplateLocale } from "../cv-templates";

export interface CVPdfTextExtractionContext {
  userId: string;
  cvId: string;
  requestId: string;
  fileSize?: number | null;
  filename?: string | null;
  pdfStoragePath?: string | null;
}

export interface CVPdfTextExtractor {
  extract(
    buffer: Buffer,
    context: CVPdfTextExtractionContext,
  ): Promise<CVDocumentExtractedTextPrimitives>;
}

export interface CVPdfStorage {
  download(path: string): Promise<Buffer>;
  upload(input: {
    path: string;
    buffer: Buffer;
    contentType: string;
    upsert?: boolean;
  }): Promise<void>;
  remove(paths: string[]): Promise<void>;
}

export interface CVTemplatePdfRenderer {
  render(input: {
    profile: StandardCVProfile;
    templateId: CVTemplateId;
    locale: CVTemplateLocale;
  }): Promise<Buffer>;
}
