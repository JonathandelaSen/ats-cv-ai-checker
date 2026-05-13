import { describe, expect, it } from "vitest";
import { createAnalysis, createCV } from "@/lib/db";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { UserId } from "@/modules/shared";
import { ProcessQuestion } from "../../domain/entities/process-question.entity";
import { ProcessQuestionId } from "../../domain/value-objects/process-question-id.value-object";
import { SupabaseProcessQuestionRepository } from "./supabase-process-question.repository";

const supabase = getSupabaseClient();
const repo = new SupabaseProcessQuestionRepository();
repo.bindRequest(supabase);

async function createLegacyLinks(userId: string) {
  const cv = await createCV(supabase, {
    id: crypto.randomUUID(),
    user_id: userId,
    name: testLabel("cv"),
    filename: "cv.pdf",
    file_size: 100,
    pdf_storage_path: null,
    text_python: "CV text",
    text_pdfjs: null,
    text_node: null,
    extract_error_python: null,
    extract_error_pdfjs: null,
    extract_error_node: null,
  });
  const analysis = await createAnalysis(supabase, {
    id: crypto.randomUUID(),
    user_id: userId,
    cv_id: cv.id,
    title: "Offer",
    filename: "cv.pdf",
    file_size: 100,
    pdf_storage_path: null,
    text_python: "CV text",
    text_pdfjs: null,
    text_node: null,
    extract_error_python: null,
    extract_error_pdfjs: null,
    extract_error_node: null,
    analysis_mode: "job_match",
    ai_model: null,
    job_description: "Job",
    job_url: null,
    ai_context: null,
    ai_score: null,
    ai_feedback: null,
    ai_keywords: null,
    ai_improvements: null,
  });
  return { cv, analysis };
}

describe("SupabaseProcessQuestionRepository", () => {
  it("saves, finds, lists, and deletes process questions", async () => {
    const user = await createTestUser("selection-question");
    const { cv, analysis } = await createLegacyLinks(user.id);
    const id = crypto.randomUUID();

    const saved = await repo.save(
      ProcessQuestion.fromPrimitives({
        id,
        userId: user.id,
        jobOpportunityId: null,
        question: "Why us?",
        context: "Context",
        answer: null,
        aiModel: null,
        aiGeneratedAt: null,
        sourceJobMatchAnalysisId: analysis.id,
        legacyInterviewQuestionId: null,
        legacyCvId: cv.id,
        createdAt: "2026-05-13T10:00:00.000Z",
        updatedAt: "2026-05-13T10:00:00.000Z",
      })
    );

    expect(saved.question.id).toBe(id);
    expect(saved.cv?.id).toBe(cv.id);
    expect(saved.analysis?.id).toBe(analysis.id);

    const found = await repo.findById(
      ProcessQuestionId.fromPrimitives(id),
      UserId.fromPrimitives(user.id)
    );
    expect(found?.question.id).toBe(id);

    const listed = await repo.search({
      userId: UserId.fromPrimitives(user.id),
      sourceJobMatchAnalysisId: analysis.id,
      answered: false,
    });
    expect(listed.map((item) => item.question.id)).toContain(id);

    await expect(
      repo.delete(ProcessQuestionId.fromPrimitives(id), UserId.fromPrimitives(user.id))
    ).resolves.toBe(true);
  });
});
