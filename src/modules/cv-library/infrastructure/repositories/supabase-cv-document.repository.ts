import { BoundSupabaseRepository } from "@/modules/shared";
import { normalizeStandardCVProfile } from "@/lib/cv-profile";
import { CVDocument } from "../../domain/entities/cv-document.entity";
import type {
  CVAnalysisUsageSummary,
  CVDocumentRepository,
  CVDocumentSearchCriteria,
} from "../../domain/repositories/cv-document.repository";
import type { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";
import type { UserId } from "@/modules/shared";

import { CV_PDFS_BUCKET } from "../../domain/services/cv-storage";

interface CVDocumentRow {
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
  profile: unknown | null;
  public_enabled: boolean;
  public_id: string | null;
  public_slug: string | null;
  public_published_at: string | null;
  text_python: string | null;
  text_pdfjs: string | null;
  text_node: string | null;
  extract_error_python: string | null;
  extract_error_pdfjs: string | null;
  extract_error_node: string | null;
  created_at: string;
  updated_at: string;
}

function rowToDocument(row: CVDocumentRow): CVDocument {
  return CVDocument.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    filename: row.filename,
    fileSize: row.file_size,
    pdfStoragePath: row.pdf_storage_path,
    type: row.type,
    sourceCvId: row.source_cv_id,
    templateId: row.template_id,
    templateLocale: row.template_locale,
    schemaVersion: row.schema_version,
    sourceTextHash: row.source_text_hash,
    aiModel: row.ai_model,
    profile: row.profile ? normalizeStandardCVProfile(row.profile) : null,
    extractedText: {
      textPython: row.text_python,
      textPdfjs: row.text_pdfjs,
      textNode: row.text_node,
      extractErrorPython: row.extract_error_python,
      extractErrorPdfjs: row.extract_error_pdfjs,
      extractErrorNode: row.extract_error_node,
    },
    publicSettings: {
      enabled: row.public_enabled,
      publicId: row.public_id,
      slug: row.public_slug,
      publishedAt: row.public_published_at,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function documentToRow(document: CVDocument): CVDocumentRow {
  const primitives = document.toPrimitives();
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
    profile: primitives.profile,
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

export class SupabaseCVDocumentRepository
  extends BoundSupabaseRepository
  implements CVDocumentRepository
{
  async search(criteria: CVDocumentSearchCriteria): Promise<CVDocument[]> {
    const { data, error } = await this.client
      .from("cvs")
      .select("*")
      .eq("user_id", criteria.userId.toPrimitives())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as CVDocumentRow[]).map(rowToDocument);
  }

  async findById(id: CVDocumentId, userId: UserId): Promise<CVDocument | null> {
    const { data, error } = await this.client
      .from("cvs")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();

    if (error) throw error;
    return data ? rowToDocument(data as CVDocumentRow) : null;
  }

  async findPublishedByPublicId(publicId: string): Promise<CVDocument | null> {
    const { data, error } = await this.client
      .from("cvs")
      .select("*")
      .eq("public_id", publicId)
      .eq("public_enabled", true)
      .eq("type", "template")
      .maybeSingle();

    if (error) throw error;
    return data ? rowToDocument(data as CVDocumentRow) : null;
  }

  async save(document: CVDocument): Promise<CVDocument> {
    const { data, error } = await this.client
      .from("cvs")
      .upsert(documentToRow(document), { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;
    return rowToDocument(data as CVDocumentRow);
  }

  async delete(id: CVDocumentId, userId: UserId): Promise<void> {
    const { error } = await this.client
      .from("cvs")
      .delete()
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());

    if (error) throw error;
  }

  async deleteStoredPdf(path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(CV_PDFS_BUCKET)
      .remove([path]);
    if (error) throw error;
  }

  async listAnalysisUsage(
    id: CVDocumentId,
    userId: UserId,
  ): Promise<CVAnalysisUsageSummary[]> {
    const [cvResult, jobMatchResult] = await Promise.all([
      this.client
        .from("cv_analyses")
        .select(
          "id, cv_document_id, title, filename, created_at, score, analyzed_at",
        )
        .eq("cv_document_id", id.toPrimitives())
        .eq("user_id", userId.toPrimitives()),
      this.client
        .from("job_match_analyses")
        .select(
          "id, cv_document_id, title, filename, created_at, score, analyzed_at, job_snapshot",
        )
        .eq("cv_document_id", id.toPrimitives())
        .eq("user_id", userId.toPrimitives()),
    ]);

    if (cvResult.error) throw cvResult.error;
    if (jobMatchResult.error) throw jobMatchResult.error;

    const cvAnalyses = (cvResult.data ?? []).map((row) => ({
      id: row.id as string,
      cv_id: row.cv_document_id as string | null,
      title: row.title as string,
      filename: row.filename as string,
      created_at: row.created_at as string,
      analysis_mode: "general" as const,
      ai_score: row.score as number | null,
      ai_analyzed_at: row.analyzed_at as string | null,
      job_url: null,
      offer_status: null,
      offer_next_action_at: null,
    }));
    const jobMatchAnalyses = (jobMatchResult.data ?? []).map((row) => {
      const snapshot =
        row.job_snapshot && typeof row.job_snapshot === "object"
          ? (row.job_snapshot as Record<string, unknown>)
          : {};
      return {
        id: row.id as string,
        cv_id: row.cv_document_id as string | null,
        title: row.title as string,
        filename: row.filename as string,
        created_at: row.created_at as string,
        analysis_mode: "job_match" as const,
        ai_score: row.score as number | null,
        ai_analyzed_at: row.analyzed_at as string | null,
        job_url: typeof snapshot.url === "string" ? snapshot.url : null,
        offer_status: null,
        offer_next_action_at: null,
      };
    });

    return [...cvAnalyses, ...jobMatchAnalyses].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  }
}
