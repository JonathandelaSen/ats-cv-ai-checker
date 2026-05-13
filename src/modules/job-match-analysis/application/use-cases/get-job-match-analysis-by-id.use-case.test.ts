import { describe, expect, it, vi } from "vitest";
import { GetJobMatchAnalysisByIdUseCase } from "./get-job-match-analysis-by-id.use-case";
import type { JobMatchAnalysisRepository } from "../../domain/repositories/job-match-analysis.repository";

describe("GetJobMatchAnalysisByIdUseCase", () => {
  it("delegates to repository findById", async () => {
    const repo = {
      search: vi.fn(),
      findById: vi.fn(async () => null),
      save: vi.fn(),
      delete: vi.fn(),
    } satisfies JobMatchAnalysisRepository;
    await new GetJobMatchAnalysisByIdUseCase({ repo }).execute({
      id: "analysis-1",
      userId: "user-1",
    });
    expect(repo.findById).toHaveBeenCalledOnce();
  });
});
