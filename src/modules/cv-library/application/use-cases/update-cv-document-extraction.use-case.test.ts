import { describe, expect, it, vi } from "vitest";
import { document } from "./cv-library-test-helpers.test";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";
import { UpdateCVDocumentExtractionUseCase } from "./update-cv-document-extraction.use-case";

describe("UpdateCVDocumentExtractionUseCase", () => {
  it("updates extracted text and records observability", async () => {
    const cv = document();
    const repo = {
      search: vi.fn(),
      findById: vi.fn(async () => cv),
      findPublishedByPublicId: vi.fn(),
      save: vi.fn(async (saved) => saved),
      delete: vi.fn(),
      deleteStoredPdf: vi.fn(),
      listAnalysisUsage: vi.fn(),
    } satisfies CVDocumentRepository;
    const tracker = { record: vi.fn(async () => {}) };

    const result = await new UpdateCVDocumentExtractionUseCase({
      documentRepo: repo,
      tracker,
    }).execute({
      id: "cv-1",
      userId: "user-1",
      extractedText: {
        textPython: "new text",
        textPdfjs: null,
        textNode: null,
        extractErrorPython: null,
        extractErrorPdfjs: null,
        extractErrorNode: null,
      },
    });

    expect(result?.toPrimitives().extractedText.textPython).toBe("new text");
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "cv_library_extraction_updated" }),
    );
  });
});
