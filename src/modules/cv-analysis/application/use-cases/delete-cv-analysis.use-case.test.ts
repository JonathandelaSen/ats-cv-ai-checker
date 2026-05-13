import { describe, expect, it, vi } from "vitest";
import { DeleteCVAnalysisUseCase } from "./delete-cv-analysis.use-case";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";

describe("DeleteCVAnalysisUseCase", () => {
  it("delegates deletion to the repository", async () => {
    const repo = {
      search: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(async () => true),
    } satisfies CVAnalysisRepository;

    await expect(
      new DeleteCVAnalysisUseCase({ repo }).execute({
        id: "analysis-1",
        userId: "user-1",
      }),
    ).resolves.toBe(true);
    expect(repo.delete).toHaveBeenCalledOnce();
  });
});
