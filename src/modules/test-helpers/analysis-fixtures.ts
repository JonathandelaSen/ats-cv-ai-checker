import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createAnalysisFacade,
  updateAnalysisAIResultFacade,
} from "@/lib/analysis-facade";

export async function createTestJobMatchAnalysis(
  supabase: SupabaseClient,
  input: {
    id: string;
    userId: string;
    cvId: string;
    title: string;
    filename?: string;
    text?: string | null;
    score?: number | null;
  },
) {
  const analysis = await createAnalysisFacade(supabase, {
    id: input.id,
    user_id: input.userId,
    cv_id: input.cvId,
    title: input.title,
    filename: input.filename ?? "cv.pdf",
    file_size: 100,
    pdf_storage_path: null,
    extracted_text: {
      text_python: input.text ?? "Analysis text",
      text_pdfjs: null,
      text_node: null,
      extract_error_python: null,
      extract_error_pdfjs: null,
      extract_error_node: null,
    },
    analysis_mode: "job_match",
    ai_model: "model",
    job_description: "Job",
    job_url: null,
    ai_context: null,
  });

  if (typeof input.score === "number") {
    return updateAnalysisAIResultFacade(supabase, analysis.id, input.userId, {
      analysis_mode: "job_match",
      ai_model: "model",
      job_description: "Job",
      job_url: null,
      ai_context: null,
      ai_score: input.score,
      ai_feedback: "Good",
      ai_keywords: ["ts"],
      ai_improvements: ["more"],
      job_key_data: null,
      job_keywords: [],
      cv_keywords: ["ts"],
      matching_keywords: ["ts"],
      missing_keywords: [],
    });
  }

  return analysis;
}
