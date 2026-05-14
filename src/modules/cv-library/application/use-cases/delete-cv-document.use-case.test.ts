import { describe, expect, it } from "vitest";
import {
  ListCVAnalysisUsageByDocumentQuery,
  type ListCVAnalysisUsageByDocumentResult,
} from "@/modules/cv-analysis";
import { ListJobMatchAnalysisUsageByDocumentQuery } from "@/modules/job-match-analysis";
import type { QueryBus } from "@/modules/shared";
import { documentRepo, tracker } from "./cv-library-test-helpers.test";
import { DeleteCVDocumentUseCase } from "./delete-cv-document.use-case";

function queryBus(
  results: Partial<Record<string, ListCVAnalysisUsageByDocumentResult[]>> = {},
) {
  return {
    execute: async (query) => results[query.queryName] ?? [],
  } satisfies QueryBus;
}

describe("DeleteCVDocumentUseCase", () => {
  it("blocks uploaded document deletion when analyses still use it", async () => {
    const repo = documentRepo();

    const result = await new DeleteCVDocumentUseCase({
      documentRepo: repo,
      queryBus: queryBus({
        [ListCVAnalysisUsageByDocumentQuery.queryName]: [
          {
            id: "analysis-1",
            cv_id: "cv-1",
            title: "Analysis",
            filename: "cv.pdf",
            created_at: "2026-05-13T10:00:00.000Z",
            analysis_mode: "general",
            ai_score: null,
            ai_analyzed_at: null,
            job_url: null,
            offer_status: null,
            offer_next_action_at: null,
          },
        ],
      }),
      tracker: tracker(),
    }).execute({ id: "cv-1", userId: "user-1" });

    expect(result.status).toBe("in_use");
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it("deletes storage and the document when not in use", async () => {
    const repo = documentRepo();
    const result = await new DeleteCVDocumentUseCase({
      documentRepo: repo,
      queryBus: queryBus(),
      tracker: tracker(),
    }).execute({ id: "cv-1", userId: "user-1" });

    expect(result.status).toBe("deleted");
    expect(repo.deleteStoredPdf).toHaveBeenCalledWith("user-1/cv-1.pdf");
    expect(repo.delete).toHaveBeenCalledOnce();
  });

  it("checks both analysis modules through the query bus before deleting", async () => {
    const executed: string[] = [];
    const repo = documentRepo();
    const bus = {
      execute: async (query) => {
        executed.push(query.queryName);
        return [];
      },
    } satisfies QueryBus;

    await new DeleteCVDocumentUseCase({
      documentRepo: repo,
      queryBus: bus,
      tracker: tracker(),
    }).execute({ id: "cv-1", userId: "user-1" });

    expect(executed).toEqual([
      ListCVAnalysisUsageByDocumentQuery.queryName,
      ListJobMatchAnalysisUsageByDocumentQuery.queryName,
    ]);
  });
});
