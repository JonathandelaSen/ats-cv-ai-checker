export type JobMatchAnalysisOfferStatus =
  | "interesante"
  | "aplicado"
  | "entrevista"
  | "oferta"
  | "rechazado"
  | "descartado";

export interface JobMatchAnalysisSummaryResponse {
  id: string;
  cvId: string | null;
  title: string;
  filename: string;
  createdAt: string;
  aiScore: number | null;
  aiAnalyzedAt: string | null;
  jobUrl: string | null;
  offerStatus: JobMatchAnalysisOfferStatus | null;
  offerNextActionAt: string | null;
}

export interface JobMatchAnalysisDetailResponse {
  id: string;
  userId: string;
  cvId: string | null;
  title: string;
  filename: string;
  fileSize: number | null;
  pdfStoragePath: string | null;
  createdAt: string;
  updatedAt: string;
  aiModel: string | null;
  jobDescription: string | null;
  jobUrl: string | null;
  offerStatus: JobMatchAnalysisOfferStatus | null;
  offerNotes: string | null;
  offerNextAction: string | null;
  offerNextActionAt: string | null;
  aiScore: number | null;
  aiFeedback: string | null;
  aiKeywords: string | null;
  aiImprovements: string | null;
  aiAnalyzedAt: string | null;
  jobKeyData: string | null;
  jobKeywords: string | null;
  cvKeywords: string | null;
  matchingKeywords: string | null;
  missingKeywords: string | null;
  textPython: string | null;
  textPdfjs: string | null;
  textNode: string | null;
  extractErrorPython: string | null;
  extractErrorPdfjs: string | null;
  extractErrorNode: string | null;
  cv: {
    id: string;
    name: string;
    filename: string | null;
    type?: string;
  } | null;
}

export type ListJobMatchAnalysesResponse = JobMatchAnalysisSummaryResponse[];
export type GetJobMatchAnalysisResponse = JobMatchAnalysisDetailResponse;
export type ScoreJobMatchAnalysisResponse = JobMatchAnalysisDetailResponse;
export type UpdateJobMatchAnalysisResponse = JobMatchAnalysisDetailResponse;

export interface DeleteJobMatchAnalysisResponse {
  success: true;
}

interface LegacySummary {
  id: string;
  cv_id: string | null;
  title: string;
  filename: string;
  created_at: string;
  ai_score: number | null;
  ai_analyzed_at: string | null;
  job_url: string | null;
  offer_status: JobMatchAnalysisOfferStatus | null;
  offer_next_action_at: string | null;
}

interface LegacyDetail extends LegacySummary {
  user_id: string;
  file_size: number | null;
  pdf_storage_path: string | null;
  updated_at: string;
  ai_model: string | null;
  job_description: string | null;
  offer_notes: string | null;
  offer_next_action: string | null;
  ai_context: unknown;
  ai_feedback: string | null;
  ai_keywords: string | null;
  ai_improvements: string | null;
  job_key_data: string | null;
  job_keywords: string | null;
  cv_keywords: string | null;
  matching_keywords: string | null;
  missing_keywords: string | null;
  text_python: string | null;
  text_pdfjs: string | null;
  text_node: string | null;
  extract_error_python: string | null;
  extract_error_pdfjs: string | null;
  extract_error_node: string | null;
  cv?: {
    id: string;
    name: string;
    filename: string | null;
    type?: string;
  } | null;
}

export function toJobMatchAnalysisSummaryResponse(
  input: LegacySummary
): JobMatchAnalysisSummaryResponse {
  return {
    id: input.id,
    cvId: input.cv_id,
    title: input.title,
    filename: input.filename,
    createdAt: input.created_at,
    aiScore: input.ai_score,
    aiAnalyzedAt: input.ai_analyzed_at,
    jobUrl: input.job_url,
    offerStatus: input.offer_status,
    offerNextActionAt: input.offer_next_action_at,
  };
}

export function toJobMatchAnalysisDetailResponse(
  input: LegacyDetail
): JobMatchAnalysisDetailResponse {
  return {
    id: input.id,
    userId: input.user_id,
    cvId: input.cv_id,
    title: input.title,
    filename: input.filename,
    fileSize: input.file_size,
    pdfStoragePath: input.pdf_storage_path,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
    aiModel: input.ai_model,
    jobDescription: input.job_description,
    jobUrl: input.job_url,
    offerStatus: input.offer_status,
    offerNotes: input.offer_notes,
    offerNextAction: input.offer_next_action,
    offerNextActionAt: input.offer_next_action_at,
    aiScore: input.ai_score,
    aiFeedback: input.ai_feedback,
    aiKeywords: input.ai_keywords,
    aiImprovements: input.ai_improvements,
    aiAnalyzedAt: input.ai_analyzed_at,
    jobKeyData: input.job_key_data,
    jobKeywords: input.job_keywords,
    cvKeywords: input.cv_keywords,
    matchingKeywords: input.matching_keywords,
    missingKeywords: input.missing_keywords,
    textPython: input.text_python,
    textPdfjs: input.text_pdfjs,
    textNode: input.text_node,
    extractErrorPython: input.extract_error_python,
    extractErrorPdfjs: input.extract_error_pdfjs,
    extractErrorNode: input.extract_error_node,
    cv: input.cv ?? null,
  };
}
