import { describe, expect, it } from "vitest";
import { createAnalysisFacade } from "@/lib/analysis-facade";
import { createCV } from "@/lib/db";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { UserId } from "@/modules/shared";
import { CVDocument } from "../../domain/entities/cv-document.entity";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";
import { SupabaseCVDocumentRepository } from "./supabase-cv-document.repository";

const supabase = getSupabaseClient();
const repo = new SupabaseCVDocumentRepository();
repo.bindRequest(supabase);

describe("SupabaseCVDocumentRepository", () => {
  it("saves, finds, lists, and deletes CV documents", async () => {
    const user = await createTestUser("cv-library-doc");
    const id = crypto.randomUUID();
    const saved = await repo.save(
      CVDocument.fromPrimitives({
        id,
        userId: user.id,
        name: testLabel("cv"),
        filename: "cv.pdf",
        fileSize: 100,
        pdfStoragePath: null,
        type: "uploaded",
        sourceCvId: null,
        templateId: null,
        templateLocale: null,
        schemaVersion: null,
        sourceTextHash: null,
        aiModel: null,
        profile: null,
        extractedText: {
          textPython: "CV text",
          textPdfjs: null,
          textNode: null,
          extractErrorPython: null,
          extractErrorPdfjs: null,
          extractErrorNode: null,
        },
        publicSettings: {
          enabled: false,
          publicId: null,
          slug: null,
          publishedAt: null,
        },
        createdAt: "2026-05-13T10:00:00.000Z",
        updatedAt: "2026-05-13T10:00:00.000Z",
      }),
    );

    expect(saved.id).toBe(id);
    await expect(
      repo.findById(
        CVDocumentId.fromPrimitives(id),
        UserId.fromPrimitives(user.id),
      ),
    ).resolves.toMatchObject({ id });

    const listed = await repo.search({
      userId: UserId.fromPrimitives(user.id),
    });
    expect(listed.map((item) => item.id)).toContain(id);

    await repo.delete(
      CVDocumentId.fromPrimitives(id),
      UserId.fromPrimitives(user.id),
    );
    await expect(
      repo.findById(
        CVDocumentId.fromPrimitives(id),
        UserId.fromPrimitives(user.id),
      ),
    ).resolves.toBeNull();
  });

  it("finds published template documents and legacy analysis usage", async () => {
    const user = await createTestUser("cv-library-public");
    const cv = await createCV(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: testLabel("public-cv"),
      filename: null,
      file_size: null,
      pdf_storage_path: null,
      type: "template",
      profile: { basics: { name: "Ada" } },
    });
    const publicId = testLabel("pub");
    await supabase
      .from("cvs")
      .update({
        public_enabled: true,
        public_id: publicId,
        public_slug: "ada-cv",
      })
      .eq("id", cv.id);
    await createAnalysisFacade(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      cv_id: cv.id,
      title: "Analysis",
      filename: "cv.pdf",
      file_size: null,
      pdf_storage_path: null,
      extracted_text: {
        text_python: null,
        text_pdfjs: null,
        text_node: null,
        extract_error_python: null,
        extract_error_pdfjs: null,
        extract_error_node: null,
      },
      analysis_mode: "general",
      ai_model: null,
      job_description: null,
      job_url: null,
      ai_context: null,
    });

    const published = await repo.findPublishedByPublicId(publicId);
    expect(published?.id).toBe(cv.id);

    const usage = await repo.listAnalysisUsage(
      CVDocumentId.fromPrimitives(cv.id),
      UserId.fromPrimitives(user.id),
    );
    expect(usage).toHaveLength(1);
  });
});
