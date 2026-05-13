import { describe, expect, it, vi } from "vitest";
import { ListCVAnalysesUseCase } from "./list-cv-analyses.use-case";
import type { CVAnalysisRepository } from "../../domain/repositories/cv-analysis.repository";

describe("ListCVAnalysesUseCase", () => {
  it("delegates to repository search", async () => {
    const repo = {
      search: vi.fn(async () => []),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } satisfies CVAnalysisRepository;
    await new ListCVAnalysesUseCase({ repo }).execute({ userId: "user-1" });
    expect(repo.search).toHaveBeenCalledOnce();
  });
});
