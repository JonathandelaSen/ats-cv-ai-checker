import { describe, expect, it } from "vitest";
import { createCV } from "@/lib/db";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { UserId } from "@/modules/shared";
import { JobMatchAnalysis } from "../../domain/entities/job-match-analysis.entity";
import { JobMatchAnalysisId } from "../../domain/value-objects/job-match-analysis-id.value-object";
import { SupabaseJobMatchAnalysisRepository } from "./supabase-job-match-analysis.repository";

const supabase = getSupabaseClient();
const repo = new SupabaseJobMatchAnalysisRepository();
repo.bindRequest(supabase);

describe("SupabaseJobMatchAnalysisRepository", () => {
  it("saves, finds, lists, and deletes job match analyses", async () => {
    const user = await createTestUser("job-match-analysis");
    const cv = await createCV(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: testLabel("cv"),
      filename: "cv.pdf",
      file_size: 100,
      pdf_storage_path: null,
    });
    const id = crypto.randomUUID();

    await repo.save(
      JobMatchAnalysis.fromPrimitives({
        id,
        userId: user.id,
        cvDocumentId: cv.id,
        cvStructuredProfileId: null,
        jobOpportunityId: null,
        title: "Offer",
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
        aiKeywords: [],
        improvements: [],
        jobSnapshot: { description: "Job", url: null, keyData: null },
        jobKeywords: [],
        cvKeywords: [],
        matchingKeywords: [],
        missingKeywords: [],
        analyzedAt: null,
        legacyAnalysisId: null,
        createdAt: "2026-05-13T10:00:00.000Z",
        updatedAt: "2026-05-13T10:00:00.000Z",
      })
    );

    const found = await repo.findById(
      JobMatchAnalysisId.fromPrimitives(id),
      UserId.fromPrimitives(user.id)
    );
    expect(found?.id).toBe(id);

    const listed = await repo.search(UserId.fromPrimitives(user.id));
    expect(listed.map((item) => item.id)).toContain(id);

    await expect(
      repo.delete(
        JobMatchAnalysisId.fromPrimitives(id),
        UserId.fromPrimitives(user.id)
      )
    ).resolves.toBe(true);
  });
});
