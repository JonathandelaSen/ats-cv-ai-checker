import { describe, expect, it } from "vitest";
import { Timestamp, UserId } from "@/modules/shared";
import { JobMatchAnalysis } from "./job-match-analysis.entity";
import { JobMatchAnalysisId } from "../value-objects/job-match-analysis-id.value-object";

const now = "2026-05-13T10:00:00.000Z";

describe("JobMatchAnalysis", () => {
  it("creates and serializes a job match analysis", () => {
    const analysis = JobMatchAnalysis.create({
      id: JobMatchAnalysisId.fromPrimitives("analysis-1"),
      userId: UserId.fromPrimitives("user-1"),
      cvDocumentId: "cv-1",
      cvStructuredProfileId: null,
      jobOpportunityId: "job-1",
      title: "Offer analysis",
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
      aiModel: "gemini",
      score: 90,
      feedback: "Strong",
      aiKeywords: ["React"],
      improvements: ["Add metrics"],
      jobSnapshot: { description: "Job", url: "https://example.com", keyData: null },
      jobKeywords: ["React"],
      cvKeywords: ["React"],
      matchingKeywords: ["React"],
      missingKeywords: [],
      analyzedAt: "2026-05-13T11:00:00.000Z",
      legacyAnalysisId: "analysis-1",
      createdAt: Timestamp.fromPrimitives(now),
      updatedAt: Timestamp.fromPrimitives(now),
    });

    expect(analysis.toPrimitives()).toMatchObject({
      id: "analysis-1",
      jobOpportunityId: "job-1",
      score: 90,
      matchingKeywords: ["React"],
    });
  });
});
