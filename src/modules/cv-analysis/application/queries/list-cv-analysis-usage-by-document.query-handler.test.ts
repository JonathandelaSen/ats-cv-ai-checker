import { describe, expect, it, vi } from "vitest";
import { ListCVAnalysisUsageByDocumentUseCase } from "../use-cases/list-cv-analysis-usage-by-document.use-case";
import { ListCVAnalysisUsageByDocumentQuery } from "./list-cv-analysis-usage-by-document.query";
import { ListCVAnalysisUsageByDocumentQueryHandler } from "./list-cv-analysis-usage-by-document.query-handler";

describe("ListCVAnalysisUsageByDocumentQueryHandler", () => {
  it("delegates to the use case and presents only analyses for the CV document", async () => {
    const useCase = {
      execute: vi.fn(async () => [
        {
          toPrimitives: () => ({
            id: "analysis-1",
            cvDocumentId: "cv-1",
            title: "General analysis",
            filename: "cv.pdf",
            createdAt: "2026-05-13T10:00:00.000Z",
            score: 82,
            analyzedAt: "2026-05-13T10:05:00.000Z",
          }),
        },
      ]),
    };
    const handler = new ListCVAnalysisUsageByDocumentQueryHandler(
      useCase as unknown as ListCVAnalysisUsageByDocumentUseCase,
    );
    const query = new ListCVAnalysisUsageByDocumentQuery({
      cvDocumentId: "cv-1",
      userId: "user-1",
    });

    const result = await handler.handle(query);

    expect(useCase.execute).toHaveBeenCalledWith(query.payload);
    expect(result).toEqual([
      {
        id: "analysis-1",
        cv_id: "cv-1",
        title: "General analysis",
        filename: "cv.pdf",
        created_at: "2026-05-13T10:00:00.000Z",
        analysis_mode: "general",
        ai_score: 82,
        ai_analyzed_at: "2026-05-13T10:05:00.000Z",
        job_url: null,
        offer_status: null,
        offer_next_action_at: null,
      },
    ]);
  });
});
