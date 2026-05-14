import { describe, expect, it, vi } from "vitest";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";
import { ListCVAnalysisUsageByDocumentUseCase } from "./list-cv-analysis-usage-by-document.use-case";

describe("ListCVAnalysisUsageByDocumentUseCase", () => {
  it("returns only analyses that reference the requested CV document", async () => {
    const matching = { toPrimitives: () => ({ cvDocumentId: "cv-1" }) };
    const other = { toPrimitives: () => ({ cvDocumentId: "cv-2" }) };
    const repo = {
      search: vi.fn(async () => [matching, other]),
    };

    const result = await new ListCVAnalysisUsageByDocumentUseCase({
      repo: repo as unknown as CVAnalysisRepository,
    }).execute({ cvDocumentId: "cv-1", userId: "user-1" });

    expect(repo.search).toHaveBeenCalledOnce();
    expect(result).toEqual([matching]);
  });
});
