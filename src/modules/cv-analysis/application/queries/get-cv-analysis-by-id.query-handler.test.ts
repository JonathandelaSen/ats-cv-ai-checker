import { describe, it, expect, vi } from "vitest";
import type { GetCVAnalysisByIdUseCase } from "../use-cases/get-cv-analysis-by-id.use-case";
import { GetCVAnalysisByIdQueryHandler } from "./get-cv-analysis-by-id.query-handler";
import { GetCVAnalysisByIdQuery } from "./get-cv-analysis-by-id.query";

describe("GetCVAnalysisByIdQueryHandler", () => {
  it("should return null when use case returns null", async () => {
    const useCase = { execute: vi.fn(async () => null) };
    const handler = new GetCVAnalysisByIdQueryHandler(
      useCase as unknown as GetCVAnalysisByIdUseCase,
    );
    const query = new GetCVAnalysisByIdQuery({ id: "id-1", userId: "user-1" });

    const result = await handler.handle(query);

    expect(result).toBeNull();
    expect(useCase.execute).toHaveBeenCalledWith(query.payload);
  });
});
