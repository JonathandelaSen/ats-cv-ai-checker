import type { StandardCVProfile } from "@/lib/cv-profile";
import type { ExtractedPdfText } from "@/lib/pdf-extraction";
import type {
  CVDocument,
  CVDocumentPrimitives,
} from "../../domain/entities/cv-document.entity";
import type {
  CVStructuredProfile,
  CVStructuredProfilePrimitives,
} from "../../domain/entities/cv-structured-profile.entity";

export interface CVDocumentResponse extends ExtractedPdfText {
  id: string;
  user_id: string;
  name: string;
  filename: string | null;
  file_size: number | null;
  pdf_storage_path: string | null;
  type: "uploaded" | "template";
  source_cv_id: string | null;
  template_id: string | null;
  template_locale: string | null;
  schema_version: string | null;
  source_text_hash: string | null;
  ai_model: string | null;
  profile: StandardCVProfile | null;
  public_enabled: boolean;
  public_id: string | null;
  public_slug: string | null;
  public_published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CVDocumentSummaryResponse {
  id: string;
  name: string;
  filename: string | null;
  file_size: number | null;
  type: "uploaded" | "template";
  source_cv_id: string | null;
  template_id: string | null;
  template_locale: string | null;
  profile: StandardCVProfile | null;
  public_enabled: boolean;
  public_id: string | null;
  public_slug: string | null;
  public_published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CVStructuredProfileResponse {
  id: string;
  user_id: string;
  cv_id: string;
  schema_version: string;
  source_text_hash: string;
  ai_model: string;
  profile: StandardCVProfile;
  created_at: string;
  updated_at: string;
}

function documentPrimitives(document: CVDocument): CVDocumentPrimitives {
  return document.toPrimitives();
}

export function presentCVDocument(document: CVDocument): CVDocumentResponse {
  const primitives = documentPrimitives(document);
  return {
    id: primitives.id,
    user_id: primitives.userId,
    name: primitives.name,
    filename: primitives.filename,
    file_size: primitives.fileSize,
    pdf_storage_path: primitives.pdfStoragePath,
    type: primitives.type,
    source_cv_id: primitives.sourceCvId,
    template_id: primitives.templateId,
    template_locale: primitives.templateLocale,
    schema_version: primitives.schemaVersion,
    source_text_hash: primitives.sourceTextHash,
    ai_model: primitives.aiModel,
    profile: primitives.profile as StandardCVProfile | null,
    public_enabled: primitives.publicSettings.enabled,
    public_id: primitives.publicSettings.publicId,
    public_slug: primitives.publicSettings.slug,
    public_published_at: primitives.publicSettings.publishedAt,
    text_python: primitives.extractedText.textPython,
    text_pdfjs: primitives.extractedText.textPdfjs,
    text_node: primitives.extractedText.textNode,
    extract_error_python: primitives.extractedText.extractErrorPython,
    extract_error_pdfjs: primitives.extractedText.extractErrorPdfjs,
    extract_error_node: primitives.extractedText.extractErrorNode,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export function presentCVDocumentSummary(
  document: CVDocument
): CVDocumentSummaryResponse {
  const primitives = documentPrimitives(document);
  return {
    id: primitives.id,
    name: primitives.name,
    filename: primitives.filename,
    file_size: primitives.fileSize,
    type: primitives.type,
    source_cv_id: primitives.sourceCvId,
    template_id: primitives.templateId,
    template_locale: primitives.templateLocale,
    profile: primitives.profile as StandardCVProfile | null,
    public_enabled: primitives.publicSettings.enabled,
    public_id: primitives.publicSettings.publicId,
    public_slug: primitives.publicSettings.slug,
    public_published_at: primitives.publicSettings.publishedAt,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export function presentCVDocuments(
  documents: CVDocument[]
): CVDocumentSummaryResponse[] {
  return documents.map(presentCVDocumentSummary);
}

export function presentCVStructuredProfile(
  profile: CVStructuredProfile
): CVStructuredProfileResponse {
  const primitives: CVStructuredProfilePrimitives = profile.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    cv_id: primitives.cvDocumentId,
    schema_version: primitives.schemaVersion,
    source_text_hash: primitives.sourceTextHash,
    ai_model: primitives.aiModel,
    profile: primitives.profile as StandardCVProfile,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}
