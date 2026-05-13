import { describe, expect, it, vi } from "vitest";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";
import { DeleteJobMatchAnalysisUseCase } from "./delete-job-match-analysis.use-case";

describe("DeleteJobMatchAnalysisUseCase", () => {
  it("delegates deletion to the repository", async () => {
    const repo = {
      search: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(async () => true),
    } satisfies JobMatchAnalysisRepository;

    await expect(
      new DeleteJobMatchAnalysisUseCase({ repo }).execute({
        id: "analysis-1",
        userId: "user-1",
      }),
    ).resolves.toBe(true);
    expect(repo.delete).toHaveBeenCalledOnce();
  });
});
