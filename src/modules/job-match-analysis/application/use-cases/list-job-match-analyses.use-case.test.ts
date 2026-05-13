import { describe, expect, it, vi } from "vitest";
import { ListJobMatchAnalysesUseCase } from "./list-job-match-analyses.use-case";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";

describe("ListJobMatchAnalysesUseCase", () => {
  it("delegates to repository search", async () => {
    const repo = {
      search: vi.fn(async () => []),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } satisfies JobMatchAnalysisRepository;
    await new ListJobMatchAnalysesUseCase({ repo }).execute({
      userId: "user-1",
    });
    expect(repo.search).toHaveBeenCalledOnce();
  });
});
