import { BoundSupabaseRepository, type UserId } from "@/modules/shared";
import { JobMatchAnalysis } from "../../domain/entities/job-match-analysis.entity";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import type { JobMatchAnalysisId } from "../../domain/value-objects/job-match-analysis-id.value-object";

interface JobMatchAnalysisRow {
  id: string;
  user_id: string;
  cv_document_id: string | null;
  cv_structured_profile_id: string | null;
  job_opportunity_id: string | null;
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
  ai_keywords: string[] | null;
  improvements: string[] | null;
  job_snapshot: unknown | null;
  job_keywords: string[] | null;
  cv_keywords: string[] | null;
  matching_keywords: string[] | null;
  missing_keywords: string[] | null;
  analyzed_at: string | null;
  legacy_analysis_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToAnalysis(row: JobMatchAnalysisRow): JobMatchAnalysis {
  return JobMatchAnalysis.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    cvDocumentId: row.cv_document_id,
    cvStructuredProfileId: row.cv_structured_profile_id,
    jobOpportunityId: row.job_opportunity_id,
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
    aiKeywords: row.ai_keywords ?? [],
    improvements: row.improvements ?? [],
    jobSnapshot: row.job_snapshot,
    jobKeywords: row.job_keywords ?? [],
    cvKeywords: row.cv_keywords ?? [],
    matchingKeywords: row.matching_keywords ?? [],
    missingKeywords: row.missing_keywords ?? [],
    analyzedAt: row.analyzed_at,
    legacyAnalysisId: row.legacy_analysis_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function analysisToRow(analysis: JobMatchAnalysis): JobMatchAnalysisRow {
  const p = analysis.toPrimitives();
  return {
    id: p.id,
    user_id: p.userId,
    cv_document_id: p.cvDocumentId,
    cv_structured_profile_id: p.cvStructuredProfileId,
    job_opportunity_id: p.jobOpportunityId,
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
    ai_keywords: p.aiKeywords,
    improvements: p.improvements,
    job_snapshot: p.jobSnapshot,
    job_keywords: p.jobKeywords,
    cv_keywords: p.cvKeywords,
    matching_keywords: p.matchingKeywords,
    missing_keywords: p.missingKeywords,
    analyzed_at: p.analyzedAt,
    legacy_analysis_id: p.legacyAnalysisId,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export class SupabaseJobMatchAnalysisRepository
  extends BoundSupabaseRepository
  implements JobMatchAnalysisRepository
{
  async search(userId: UserId): Promise<JobMatchAnalysis[]> {
    const { data, error } = await this.client
      .from("job_match_analyses")
      .select("*")
      .eq("user_id", userId.toPrimitives())
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as JobMatchAnalysisRow[]).map(rowToAnalysis);
  }

  async findById(
    id: JobMatchAnalysisId,
    userId: UserId
  ): Promise<JobMatchAnalysis | null> {
    const { data, error } = await this.client
      .from("job_match_analyses")
      .select("*")
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .maybeSingle();
    if (error) throw error;
    return data ? rowToAnalysis(data as JobMatchAnalysisRow) : null;
  }

  async save(analysis: JobMatchAnalysis): Promise<JobMatchAnalysis> {
    const { data, error } = await this.client
      .from("job_match_analyses")
      .upsert(analysisToRow(analysis), { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return rowToAnalysis(data as JobMatchAnalysisRow);
  }

  async delete(id: JobMatchAnalysisId, userId: UserId): Promise<boolean> {
    const { count, error } = await this.client
      .from("job_match_analyses")
      .delete({ count: "exact" })
      .eq("id", id.toPrimitives())
      .eq("user_id", userId.toPrimitives());
    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
