import { describe, expect, it, vi } from "vitest";
import { GetCVAnalysisByIdUseCase } from "./get-cv-analysis-by-id.use-case";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";

describe("GetCVAnalysisByIdUseCase", () => {
  it("delegates to repository findById", async () => {
    const repo = {
      search: vi.fn(),
      findById: vi.fn(async () => null),
      save: vi.fn(),
      delete: vi.fn(),
    } satisfies CVAnalysisRepository;
    await new GetCVAnalysisByIdUseCase({ repo }).execute({
      id: "analysis-1",
      userId: "user-1",
    });
    expect(repo.findById).toHaveBeenCalledOnce();
  });
});
