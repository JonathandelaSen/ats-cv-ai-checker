import { BoundSupabaseRepository, type UserId } from "@/modules/shared";
import { CVAnalysis } from "../../domain/entities/cv-analysis.entity";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";
import type { CVAnalysisId } from "../../domain/value-objects/cv-analysis-id.value-object";

interface CVAnalysisRow {
  id: string;
  user_id: string;
  cv_document_id: string | null;
  cv_structured_profile_id: string | null;
  title: string;
  filename: string;
  file_size: number | null;
  pdf_storage_path: string | null;
  text_python: string | null;
  text_pdfjs: string | null;
  text_node: string | null;
  extract_error_python: string | null;
  extract_error_pdfjs: string | null;
  extract_error_node: string | null;
  ai_model: string | null;
  score: number | null;
  feedback: string | null;
  keywords: string[] | null;
  improvements: string[] | null;
  ai_context: unknown | null;
  analyzed_at: string | null;
  legacy_analysis_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToAnalysis(row: CVAnalysisRow): CVAnalysis {
  return CVAnalysis.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    cvDocumentId: row.cv_document_id,
    cvStructuredProfileId: row.cv_structured_profile_id,
    title: row.title,
    filename: row.filename,
    fileSize: row.file_size,
    pdfStoragePath: row.pdf_storage_path,
    extractedText: {
      textPython: row.text_python,
      textPdfjs: row.text_pdfjs,
      textNode: row.text_node,
      extractErrorPython: row.extract_error_python,
      extractErrorPdfjs: row.extract_error_pdfjs,
      extractErrorNode: row.extract_error_node,
    },
    aiModel: row.ai_model,
    score: row.score,
    feedback: row.feedback,
    keywords: row.keywords ?? [],
    improvements: row.improvements ?? [],
    aiContext: row.ai_context,
    analyzedAt: row.analyzed_at,
    legacyAnalysisId: row.legacy_analysis_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function analysisToRow(analysis: CVAnalysis): CVAnalysisRow {
  const p = analysis.toPrimitives();
  return {
    id: p.id,
    user_id: p.userId,
    cv_document_id: p.cvDocumentId,
    cv_structured_profile_id: p.cvStructuredProfileId,
    title: p.title,
    filename: p.filename,
    file_size: p.fileSize,
    pdf_storage_path: p.pdfStoragePath,
    text_python: p.extractedText.textPython,
    text_pdfjs: p.extractedText.textPdfjs,
    text_node: p.extractedText.textNode,
    extract_error_python: p.extractedText.extractErrorPython,
    extract_error_pdfjs: p.extractedText.extractErrorPdfjs,
    extract_error_node: p.extractedText.extractErrorNode,
    ai_model: p.aiModel,
    score: p.score,
    feedback: p.feedback,
    keywords: p.keywords,
    improvements: p.improvements,
    ai_context: p.aiContext,
    analyzed_at: p.analyzedAt,
    legacy_analysis_id: p.legacyAnalysisId,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export class SupabaseCVAnalysisRepository
  extends BoundSupabaseRepository
  implements CVAnalysisRepository
{
  async search(userId: UserId): Promise<CVAnalysis[]> {
    const { data, error } = await this.client
      .from("cv_analyses")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as CVAnalysisRow[]).map(rowToAnalysis);
  }

  async findById(id: CVAnalysisId, userId: UserId): Promise<CVAnalysis | null> {
    const { data, error } = await this.client
      .from("cv_analyses")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();
    if (error) throw error;
    return data ? rowToAnalysis(data as CVAnalysisRow) : null;
  }

  async save(analysis: CVAnalysis): Promise<CVAnalysis> {
    const { data, error } = await this.client
      .from("cv_analyses")
      .upsert(analysisToRow(analysis), { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return rowToAnalysis(data as CVAnalysisRow);
  }

  async delete(id: CVAnalysisId, userId: UserId): Promise<boolean> {
    const { count, error } = await this.client
      .from("cv_analyses")
      .delete({ count: "exact" })
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());
    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
