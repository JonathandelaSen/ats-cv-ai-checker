import { describe, expect, it } from "vitest";
import { createAnalysis, createCV } from "@/lib/db";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { UserId } from "@/modules/shared";
import { SupabaseFollowUpRepository } from "./supabase-follow-up.repository";

const supabase = getSupabaseClient();
const repo = new SupabaseFollowUpRepository();
repo.bindRequest(supabase);

describe("SupabaseFollowUpRepository", () => {
  it("finds and saves follow-ups by source analysis", async () => {
    const user = await createTestUser("selection-follow-up");
    const cv = await createCV(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: testLabel("cv"),
      filename: "cv.pdf",
      file_size: 100,
      pdf_storage_path: null,
    });
    const analysis = await createAnalysis(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      cv_id: cv.id,
      title: "Offer",
      filename: "cv.pdf",
      file_size: 100,
      pdf_storage_path: null,
      text_python: null,
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

    const found = await repo.findBySourceJobMatchAnalysisId(
      analysis.id,
      UserId.fromPrimitives(user.id)
    );

    expect(found?.toPrimitives()).toMatchObject({
      sourceJobMatchAnalysisId: analysis.id,
      status: "interesante",
    });

    found?.update({
      status: await import("../../domain/value-objects/follow-up-status.value-object").then(
        (mod) => mod.FollowUpStatus.fromPrimitives("aplicado")
      ),
      notes: "Sent",
      nextAction: "Follow up",
      nextActionAt: null,
      updatedAt: await import("@/modules/shared").then((mod) =>
        mod.Timestamp.fromPrimitives("2026-05-13T11:00:00.000Z")
      ),
    });
    const saved = await repo.save(found!);
    expect(saved.toPrimitives().status).toBe("aplicado");
  });
});
