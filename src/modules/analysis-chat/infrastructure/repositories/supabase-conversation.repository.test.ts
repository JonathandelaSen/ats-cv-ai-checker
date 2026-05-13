import { describe, expect, it } from "vitest";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { createTestJobMatchAnalysis } from "@/modules/test-helpers/analysis-fixtures";
import { createTestCV } from "@/modules/test-helpers/cv-fixtures";
import { UserId } from "@/modules/shared";
import { SupabaseConversationRepository } from "./supabase-conversation.repository";
import { AnalysisChatConversationId } from "../../domain/value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisReference } from "../../domain/value-objects/analysis-reference.value-object";

const supabase = getSupabaseClient();
const repo = new SupabaseConversationRepository();
repo.bindRequest(supabase);

async function createJobMatchAnalysis(userId: string) {
  const cv = await createTestCV(supabase, {
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
  const analysis = await createTestJobMatchAnalysis(supabase, {
    id: crypto.randomUUID(),
    userId,
    cvId: cv.id,
    title: testLabel("analysis"),
    text: "CV text",
    score: 80,
  });
  if (!analysis) throw new Error("Failed to create test analysis");
  return analysis;
}

describe("SupabaseConversationRepository", () => {
  it("creates, finds, searches, renames, and deletes conversations", async () => {
    const user = await createTestUser("analysis-chat-conv");
    const analysis = await createJobMatchAnalysis(user.id);
    const conversation = await repo.create({
      user_id: user.id,
      analysis_id: analysis.id,
      title: "Chat inicial",
    });

    expect(conversation.toPrimitives()).toMatchObject({
      userId: user.id,
      analysisReference: { type: "job_match_analysis", id: analysis.id },
      title: "Chat inicial",
    });

    const found = await repo.findById(
      AnalysisChatConversationId.fromPrimitives(conversation.id),
      UserId.fromPrimitives(user.id),
    );
    expect(found?.id).toBe(conversation.id);

    const listed = await repo.search({
      userId: UserId.fromPrimitives(user.id),
      analysisReference: AnalysisReference.fromPrimitives({
        type: "job_match_analysis",
        id: analysis.id,
      }),
    });
    expect(listed.map((item) => item.id)).toContain(conversation.id);

    found?.rename(
      await import("../../domain/value-objects/analysis-chat-title.value-object").then(
        (mod) => mod.AnalysisChatTitle.fromPrimitives("Renombrada"),
      ),
    );
    const updated = await repo.save(found!);
    expect(updated.toPrimitives().title).toBe("Renombrada");

    await repo.delete(
      AnalysisChatConversationId.fromPrimitives(conversation.id),
      UserId.fromPrimitives(user.id),
    );
    await expect(
      repo.findById(
        AnalysisChatConversationId.fromPrimitives(conversation.id),
        UserId.fromPrimitives(user.id),
      ),
    ).resolves.toBeNull();
  });
});
