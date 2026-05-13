import { describe, expect, it } from "vitest";
import { createTestCV } from "@/modules/test-helpers/cv-fixtures";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { UserId } from "@/modules/shared";
import { CVAnalysis } from "../../domain/entities/cv-analysis.entity";
import { CVAnalysisId } from "../../domain/value-objects/cv-analysis-id.value-object";
import { SupabaseCVAnalysisRepository } from "./supabase-cv-analysis.repository";

const supabase = getSupabaseClient();
const repo = new SupabaseCVAnalysisRepository();
repo.bindRequest(supabase);

describe("SupabaseCVAnalysisRepository", () => {
  it("saves, finds, lists, and deletes CV analyses", async () => {
    const user = await createTestUser("cv-analysis");
    const cv = await createTestCV(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: testLabel("cv"),
      filename: "cv.pdf",
      file_size: 100,
      pdf_storage_path: null,
    });
    const id = crypto.randomUUID();

    await repo.save(
      CVAnalysis.fromPrimitives({
        id,
        userId: user.id,
        cvDocumentId: cv.id,
        cvStructuredProfileId: null,
        title: "General",
        filename: "cv.pdf",
        fileSize: 100,
        pdfStoragePath: null,
        extractedText: {
          textPython: "text",
          textPdfjs: null,
          textNode: null,
          extractErrorPython: null,
          extractErrorPdfjs: null,
          extractErrorNode: null,
        },
        aiModel: null,
        score: null,
        feedback: null,
        keywords: [],
        improvements: [],
        aiContext: null,
        analyzedAt: null,
        legacyAnalysisId: null,
        createdAt: "2026-05-13T10:00:00.000Z",
        updatedAt: "2026-05-13T10:00:00.000Z",
      }),
    );

    const found = await repo.findById(
      CVAnalysisId.fromPrimitives(id),
      UserId.fromPrimitives(user.id),
    );
    expect(found?.id).toBe(id);

    const listed = await repo.search(UserId.fromPrimitives(user.id));
    expect(listed.map((item) => item.id)).toContain(id);

    await expect(
      repo.delete(
        CVAnalysisId.fromPrimitives(id),
        UserId.fromPrimitives(user.id),
      ),
    ).resolves.toBe(true);
  });
});
