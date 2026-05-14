import { describe, expect, it, vi } from "vitest";
import { ListJobMatchAnalysisUsageByDocumentUseCase } from "../use-cases/list-job-match-analysis-usage-by-document.use-case";
import { ListJobMatchAnalysisUsageByDocumentQuery } from "./list-job-match-analysis-usage-by-document.query";
import { ListJobMatchAnalysisUsageByDocumentQueryHandler } from "./list-job-match-analysis-usage-by-document.query-handler";

describe("ListJobMatchAnalysisUsageByDocumentQueryHandler", () => {
  it("delegates to the use case and presents job match usage for the CV document", async () => {
    const useCase = {
      execute: vi.fn(async () => [
        {
          toPrimitives: () => ({
            id: "analysis-1",
            cvDocumentId: "cv-1",
            title: "Job match",
            filename: "cv.pdf",
            createdAt: "2026-05-13T10:00:00.000Z",
            score: 91,
            analyzedAt: "2026-05-13T10:05:00.000Z",
            jobSnapshot: { url: "https://example.com/job" },
          }),
        },
      ]),
    };
    const handler = new ListJobMatchAnalysisUsageByDocumentQueryHandler(
      useCase as unknown as ListJobMatchAnalysisUsageByDocumentUseCase,
    );
    const query = new ListJobMatchAnalysisUsageByDocumentQuery({
      cvDocumentId: "cv-1",
      userId: "user-1",
    });

    const result = await handler.handle(query);

    expect(useCase.execute).toHaveBeenCalledWith(query.payload);
    expect(result).toEqual([
      {
        id: "analysis-1",
        cv_id: "cv-1",
        title: "Job match",
        filename: "cv.pdf",
        created_at: "2026-05-13T10:00:00.000Z",
        analysis_mode: "job_match",
        ai_score: 91,
        ai_analyzed_at: "2026-05-13T10:05:00.000Z",
        job_url: "https://example.com/job",
        offer_status: null,
        offer_next_action_at: null,
      },
    ]);
  });
});
