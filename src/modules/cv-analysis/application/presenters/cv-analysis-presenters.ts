import type { CVAnalysis } from "../../domain/entities/cv-analysis.entity";

export function presentCVAnalysisSummary(analysis: CVAnalysis) {
  const primitives = analysis.toPrimitives();
  return {
    id: primitives.id,
    cv_id: primitives.cvDocumentId,
    title: primitives.title,
    filename: primitives.filename,
    created_at: primitives.createdAt,
    analysis_mode: "general" as const,
    ai_score: primitives.score,
    ai_analyzed_at: primitives.analyzedAt,
    job_url: null,
    offer_status: null,
    offer_next_action_at: null,
  };
}

export function presentCVAnalysis(analysis: CVAnalysis) {
  const primitives = analysis.toPrimitives();
  return {
    ...presentCVAnalysisSummary(analysis),
    user_id: primitives.userId,
    file_size: primitives.fileSize,
    pdf_storage_path: primitives.pdfStoragePath,
    updated_at: primitives.updatedAt,
    ai_model: primitives.aiModel,
    job_description: null,
    offer_notes: null,
    offer_next_action: null,
    ai_context: primitives.aiContext,
    ai_feedback: primitives.feedback,
    ai_keywords: JSON.stringify(primitives.keywords),
    ai_improvements: JSON.stringify(primitives.improvements),
    job_key_data: null,
    job_keywords: JSON.stringify([]),
    cv_keywords: JSON.stringify(primitives.keywords),
    matching_keywords: JSON.stringify([]),
    missing_keywords: JSON.stringify([]),
    text_python: primitives.extractedText.textPython,
    text_pdfjs: primitives.extractedText.textPdfjs,
    text_node: primitives.extractedText.textNode,
    extract_error_python: primitives.extractedText.extractErrorPython,
    extract_error_pdfjs: primitives.extractedText.extractErrorPdfjs,
    extract_error_node: primitives.extractedText.extractErrorNode,
  };
}
