import type { SupabaseClient } from "@supabase/supabase-js";
import { cvAnalysisModule, jobMatchAnalysisModule } from "@/lib/container";
import {
  presentCVAnalysis,
  presentCVAnalysisSummary,
} from "@/modules/cv-analysis";
import {
  presentJobMatchAnalysis,
  presentJobMatchAnalysisSummary,
} from "@/modules/job-match-analysis";

export type AnalysisFacadeMode = "general" | "job_match";

export interface AnalysisFacadeExtractedTextInput {
  text_python: string | null;
  text_pdfjs: string | null;
  text_node: string | null;
  extract_error_python: string | null;
  extract_error_pdfjs: string | null;
  extract_error_node: string | null;
}

export interface CreateAnalysisFacadeInput {
  id: string;
  user_id: string;
  cv_id: string | null;
  title: string;
  filename: string;
  file_size: number | null;
  pdf_storage_path: string | null;
  extracted_text: AnalysisFacadeExtractedTextInput;
  analysis_mode: AnalysisFacadeMode;
  ai_model: string | null;
  job_description: string | null;
  job_url?: string | null;
  ai_context: unknown | null;
}

export interface UpdateAnalysisAIResultFacadeInput {
  analysis_mode: AnalysisFacadeMode;
  ai_model: string;
  job_description: string | null;
  job_url?: string | null;
  ai_context: unknown | null;
  ai_score: number;
  ai_feedback: string;
  ai_keywords: string[];
  ai_improvements: string[];
  job_key_data?: unknown | null;
  job_keywords?: string[];
  cv_keywords?: string[];
  matching_keywords?: string[];
  missing_keywords?: string[];
}

function extractedTextFromInput(input: AnalysisFacadeExtractedTextInput) {
  return {
    textPython: input.text_python,
    textPdfjs: input.text_pdfjs,
    textNode: input.text_node,
    extractErrorPython: input.extract_error_python,
    extractErrorPdfjs: input.extract_error_pdfjs,
    extractErrorNode: input.extract_error_node,
  };
}

export async function listAnalysisFacade(
  supabase: SupabaseClient,
  userId: string,
) {
  const [cvAnalyses, jobMatchAnalyses] = await Promise.all([
    cvAnalysisModule.bindRequest(supabase).listCVAnalyses.execute({ userId }),
    jobMatchAnalysisModule
      .bindRequest(supabase)
      .listJobMatchAnalyses.execute({ userId }),
  ]);

  return [
    ...cvAnalyses.map(presentCVAnalysisSummary),
    ...jobMatchAnalyses.map(presentJobMatchAnalysisSummary),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getAnalysisFacade(
  supabase: SupabaseClient,
  id: string,
  userId: string,
) {
  const cvAnalysis = await cvAnalysisModule
    .bindRequest(supabase)
    .getCVAnalysisById.execute({ id, userId });
  if (cvAnalysis) return presentCVAnalysis(cvAnalysis);

  const jobMatchAnalysis = await jobMatchAnalysisModule
    .bindRequest(supabase)
    .getJobMatchAnalysisById.execute({ id, userId });
  if (jobMatchAnalysis) return presentJobMatchAnalysis(jobMatchAnalysis);

  return null;
}

export async function createAnalysisFacade(
  supabase: SupabaseClient,
  input: CreateAnalysisFacadeInput,
) {
  if (input.analysis_mode === "general") {
    const analysis = await cvAnalysisModule
      .bindRequest(supabase)
      .createCVAnalysis.execute({
        id: input.id,
        userId: input.user_id,
        cvDocumentId: input.cv_id,
        title: input.title,
        filename: input.filename,
        fileSize: input.file_size,
        pdfStoragePath: input.pdf_storage_path,
        extractedText: extractedTextFromInput(input.extracted_text),
        aiModel: input.ai_model,
        aiContext: input.ai_context,
      });
    return presentCVAnalysis(analysis);
  }

  const analysis = await jobMatchAnalysisModule
    .bindRequest(supabase)
    .createJobMatchAnalysis.execute({
      id: input.id,
      userId: input.user_id,
      cvDocumentId: input.cv_id,
      title: input.title,
      filename: input.filename,
      fileSize: input.file_size,
      pdfStoragePath: input.pdf_storage_path,
      extractedText: extractedTextFromInput(input.extracted_text),
      aiModel: input.ai_model,
      jobDescription: input.job_description,
      jobUrl: input.job_url ?? null,
    });
  return presentJobMatchAnalysis(analysis);
}

export async function updateAnalysisAIResultFacade(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  input: UpdateAnalysisAIResultFacadeInput,
) {
  if (input.analysis_mode === "general") {
    const analysis = await cvAnalysisModule
      .bindRequest(supabase)
      .updateCVAnalysisAIResult.execute({
        id,
        userId,
        aiModel: input.ai_model,
        aiContext: input.ai_context,
        score: input.ai_score,
        feedback: input.ai_feedback,
        keywords: input.ai_keywords,
        improvements: input.ai_improvements,
      });
    return analysis ? presentCVAnalysis(analysis) : null;
  }

  const analysis = await jobMatchAnalysisModule
    .bindRequest(supabase)
    .updateJobMatchAnalysisAIResult.execute({
      id,
      userId,
      aiModel: input.ai_model,
      jobDescription: input.job_description,
      jobUrl: input.job_url ?? null,
      score: input.ai_score,
      feedback: input.ai_feedback,
      aiKeywords: input.ai_keywords,
      improvements: input.ai_improvements,
      jobKeyData: input.job_key_data ?? null,
      jobKeywords: input.job_keywords ?? [],
      cvKeywords: input.cv_keywords ?? input.ai_keywords,
      matchingKeywords: input.matching_keywords ?? [],
      missingKeywords: input.missing_keywords ?? [],
    });
  return analysis ? presentJobMatchAnalysis(analysis) : null;
}

export async function updateAnalysisJobUrlFacade(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  jobUrl: string | null,
) {
  const analysis = await jobMatchAnalysisModule
    .bindRequest(supabase)
    .updateJobMatchAnalysisJobUrl.execute({ id, userId, jobUrl });
  return analysis ? presentJobMatchAnalysis(analysis) : null;
}

export async function deleteAnalysisFacade(
  supabase: SupabaseClient,
  id: string,
  userId: string,
) {
  const deletedCV = await cvAnalysisModule
    .bindRequest(supabase)
    .deleteCVAnalysis.execute({ id, userId });
  if (deletedCV) return true;

  return jobMatchAnalysisModule
    .bindRequest(supabase)
    .deleteJobMatchAnalysis.execute({ id, userId });
}
