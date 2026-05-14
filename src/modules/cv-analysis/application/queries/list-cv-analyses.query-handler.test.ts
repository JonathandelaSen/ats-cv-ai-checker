import { describe, it, expect, vi } from "vitest";
import type { ListCVAnalysesUseCase } from "../use-cases/list-cv-analyses.use-case";
import { ListCVAnalysesQueryHandler } from "./list-cv-analyses.query-handler";
import { ListCVAnalysesQuery } from "./list-cv-analyses.query";

describe("ListCVAnalysesQueryHandler", () => {
  it("should return empty array when use case returns no entities", async () => {
    const useCase = { execute: vi.fn(async () => []) };
    const handler = new ListCVAnalysesQueryHandler(
      useCase as unknown as ListCVAnalysesUseCase,
    );
    const query = new ListCVAnalysesQuery({ userId: "user-1" });

    const result = await handler.handle(query);

    expect(result).toEqual([]);
    expect(useCase.execute).toHaveBeenCalledWith(query.payload);
  });
});
