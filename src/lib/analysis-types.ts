import type { StandardCVProfile } from "@/lib/cv-profile";
import type { ExtractedPdfText } from "@/lib/pdf-extraction";

export type AnalysisMode = "general" | "job_match";

export type OfferStatus =
  | "interesante"
  | "aplicado"
  | "entrevista"
  | "oferta"
  | "rechazado"
  | "descartado";

export const OFFER_STATUSES: readonly OfferStatus[] = [
  "interesante",
  "aplicado",
  "entrevista",
  "oferta",
  "rechazado",
  "descartado",
];

export interface AIContext {
  additionalContext?: string;
}

export interface JobKeyData {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  remote?: string | null;
  salary?: string | null;
  seniority?: string | null;
  contractType?: string | null;
  benefits?: string[];
  requirements?: string[];
  responsibilities?: string[];
  notablePoints?: string[];
}

export type CVType = "uploaded" | "template";

export interface CVRecord extends ExtractedPdfText {
  id: string;
  user_id: string;
  name: string;
  filename: string | null;
  file_size: number | null;
  pdf_storage_path: string | null;
  type: CVType;
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

export interface Analysis extends ExtractedPdfText {
  id: string;
  user_id: string;
  cv_id: string | null;
  title: string;
  filename: string;
  file_size: number | null;
  pdf_storage_path: string | null;
  created_at: string;
  updated_at: string;
  analysis_mode: AnalysisMode;
  ai_model: string | null;
  job_description: string | null;
  job_url: string | null;
  offer_status: OfferStatus | null;
  offer_notes: string | null;
  offer_next_action: string | null;
  offer_next_action_at: string | null;
  ai_context: AIContext | null;
  ai_score: number | null;
  ai_feedback: string | null;
  ai_keywords: string | null;
  ai_improvements: string | null;
  job_key_data: string | null;
  job_keywords: string | null;
  cv_keywords: string | null;
  matching_keywords: string | null;
  missing_keywords: string | null;
  ai_analyzed_at: string | null;
  cv?: CVRecord | null;
}

export interface AnalysisSummary {
  id: string;
  cv_id: string | null;
  title: string;
  filename: string;
  created_at: string;
  analysis_mode: AnalysisMode;
  ai_score: number | null;
  ai_analyzed_at: string | null;
  job_url: string | null;
  offer_status: OfferStatus | null;
  offer_next_action_at: string | null;
}

export interface CVRecommendationAnalysis extends AnalysisSummary {
  ai_improvements: string | null;
  missing_keywords: string | null;
  ai_keywords: string | null;
}
