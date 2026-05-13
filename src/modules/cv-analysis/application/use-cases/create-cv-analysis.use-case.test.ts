import { describe, expect, it, vi } from "vitest";
import { CreateCVAnalysisUseCase } from "./create-cv-analysis.use-case";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";

describe("CreateCVAnalysisUseCase", () => {
  it("creates a CV analysis aggregate and saves it", async () => {
    const repo = {
      search: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(async (analysis) => analysis),
      delete: vi.fn(),
    } satisfies CVAnalysisRepository;

    const result = await new CreateCVAnalysisUseCase({ repo }).execute({
      id: "analysis-1",
      userId: "user-1",
      cvDocumentId: "cv-1",
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
      aiModel: "model",
      aiContext: { targetRole: "Engineer" },
    });

    expect(repo.save).toHaveBeenCalledOnce();
    expect(result.toPrimitives()).toMatchObject({
      id: "analysis-1",
      userId: "user-1",
      cvDocumentId: "cv-1",
      score: null,
      aiContext: { targetRole: "Engineer" },
    });
  });
});
