import { describe, expect, it, vi } from "vitest";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import { ListJobMatchAnalysisUsageByDocumentUseCase } from "./list-job-match-analysis-usage-by-document.use-case";

describe("ListJobMatchAnalysisUsageByDocumentUseCase", () => {
  it("returns only job match analyses that reference the requested CV document", async () => {
    const matching = { toPrimitives: () => ({ cvDocumentId: "cv-1" }) };
    const other = { toPrimitives: () => ({ cvDocumentId: "cv-2" }) };
    const repo = {
      search: vi.fn(async () => [matching, other]),
    };

    const result = await new ListJobMatchAnalysisUsageByDocumentUseCase({
      repo: repo as unknown as JobMatchAnalysisRepository,
    }).execute({ cvDocumentId: "cv-1", userId: "user-1" });

    expect(repo.search).toHaveBeenCalledOnce();
    expect(result).toEqual([matching]);
  });
});
