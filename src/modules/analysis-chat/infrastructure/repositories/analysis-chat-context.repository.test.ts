import { describe, expect, it } from "vitest";
import {
  createAnalysisFacade,
  updateAnalysisAIResultFacade,
} from "@/lib/analysis-facade";
import { createTestCV } from "@/modules/test-helpers/cv-fixtures";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { AnalysisChatContextRepository } from "./analysis-chat-context.repository";

const supabase = getSupabaseClient();
const repo = new AnalysisChatContextRepository();
repo.bindRequest(supabase);

describe("AnalysisChatContextRepository", () => {
  it("reads legacy analysis context with linked CV text", async () => {
    const user = await createTestUser("analysis-chat-context");
    const cv = await createTestCV(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: testLabel("cv"),
      filename: "cv.pdf",
      file_size: 123,
      pdf_storage_path: null,
      text_python: "Best CV text",
      text_pdfjs: null,
      text_node: null,
      extract_error_python: null,
      extract_error_pdfjs: null,
      extract_error_node: null,
    });
    const analysis = await createAnalysisFacade(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      cv_id: cv.id,
      title: testLabel("analysis"),
      filename: "cv.pdf",
      file_size: 123,
      pdf_storage_path: null,
      extracted_text: {
        text_python: "Analysis text",
        text_pdfjs: null,
        text_node: null,
        extract_error_python: null,
        extract_error_pdfjs: null,
        extract_error_node: null,
      },
      analysis_mode: "job_match",
      ai_model: "model",
      job_description: "Job",
      job_url: "https://example.com",
      ai_context: null,
    });
    await updateAnalysisAIResultFacade(supabase, analysis.id, user.id, {
      analysis_mode: "job_match",
      ai_model: "model",
      job_description: "Job",
      job_url: "https://example.com",
      ai_context: null,
      ai_score: 91,
      ai_feedback: "Good",
      ai_keywords: ["ts"],
      ai_improvements: ["more"],
      job_key_data: null,
      job_keywords: [],
      cv_keywords: ["ts"],
      matching_keywords: ["ts"],
      missing_keywords: [],
    });

    const context = await repo.findByAnalysisId({
      analysisId: analysis.id,
      userId: user.id,
    });

    expect(context).toMatchObject({
      analysisId: analysis.id,
      cvId: cv.id,
      analysisMode: "job_match",
      cvText: "Analysis text",
    });
  });
});
