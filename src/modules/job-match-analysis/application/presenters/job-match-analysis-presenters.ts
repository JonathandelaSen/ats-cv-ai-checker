import type { Analysis, AnalysisSummary } from "@/lib/analysis-types";
import type { JobMatchAnalysis } from "../../domain/entities/job-match-analysis.entity";

function snapshotField(snapshot: unknown, key: string): unknown {
  return snapshot && typeof snapshot === "object"
    ? (snapshot as Record<string, unknown>)[key]
    : null;
}

export function presentJobMatchAnalysisSummary(analysis: JobMatchAnalysis): AnalysisSummary {
  const primitives = analysis.toPrimitives();
  return {
    id: primitives.id,
    cv_id: primitives.cvDocumentId,
    title: primitives.title,
    filename: primitives.filename,
    created_at: primitives.createdAt,
    analysis_mode: "job_match" as const,
    ai_score: primitives.score,
    ai_analyzed_at: primitives.analyzedAt,
    job_url: (snapshotField(primitives.jobSnapshot, "url") as string | null) ?? null,
    offer_status: null,
    offer_next_action_at: null,
  };
}

export function presentJobMatchAnalysis(analysis: JobMatchAnalysis): Analysis {
  const primitives = analysis.toPrimitives();
  return {
    ...presentJobMatchAnalysisSummary(analysis),
    user_id: primitives.userId,
    file_size: primitives.fileSize,
    pdf_storage_path: primitives.pdfStoragePath,
    updated_at: primitives.updatedAt,
    ai_model: primitives.aiModel,
    job_description:
      (snapshotField(primitives.jobSnapshot, "description") as string | null) ?? null,
    offer_notes: null,
    offer_next_action: null,
    ai_context: null,
    ai_feedback: primitives.feedback,
    ai_keywords: JSON.stringify(primitives.aiKeywords),
    ai_improvements: JSON.stringify(primitives.improvements),
    job_key_data: JSON.stringify(snapshotField(primitives.jobSnapshot, "keyData")),
    job_keywords: JSON.stringify(primitives.jobKeywords),
    cv_keywords: JSON.stringify(primitives.cvKeywords),
    matching_keywords: JSON.stringify(primitives.matchingKeywords),
    missing_keywords: JSON.stringify(primitives.missingKeywords),
    text_python: primitives.extractedText.textPython,
    text_pdfjs: primitives.extractedText.textPdfjs,
    text_node: primitives.extractedText.textNode,
    extract_error_python: primitives.extractedText.extractErrorPython,
    extract_error_pdfjs: primitives.extractedText.extractErrorPdfjs,
    extract_error_node: primitives.extractedText.extractErrorNode,
  };
}
