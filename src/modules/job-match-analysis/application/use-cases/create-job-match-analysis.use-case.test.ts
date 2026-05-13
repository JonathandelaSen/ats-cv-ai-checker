import { describe, expect, it, vi } from "vitest";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import { CreateJobMatchAnalysisUseCase } from "./create-job-match-analysis.use-case";

describe("CreateJobMatchAnalysisUseCase", () => {
  it("creates a job-match aggregate with an initial job snapshot", async () => {
    const repo = {
      search: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(async (analysis) => analysis),
      delete: vi.fn(),
    } satisfies JobMatchAnalysisRepository;

    const result = await new CreateJobMatchAnalysisUseCase({ repo }).execute({
      id: "analysis-1",
      userId: "user-1",
      cvDocumentId: "cv-1",
      title: "Match",
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
      jobDescription: "Build things",
      jobUrl: "https://example.com/job",
    });

    expect(result.toPrimitives().jobSnapshot).toMatchObject({
      description: "Build things",
      url: "https://example.com/job",
      keyData: null,
    });
  });
});
