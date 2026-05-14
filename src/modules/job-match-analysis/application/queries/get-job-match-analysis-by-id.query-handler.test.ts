import { describe, it, expect, vi } from "vitest";
import type { GetJobMatchAnalysisByIdUseCase } from "../use-cases/get-job-match-analysis-by-id.use-case";
import { GetJobMatchAnalysisByIdQueryHandler } from "./get-job-match-analysis-by-id.query-handler";
import { GetJobMatchAnalysisByIdQuery } from "./get-job-match-analysis-by-id.query";

describe("GetJobMatchAnalysisByIdQueryHandler", () => {
  it("should return null when use case returns null", async () => {
    const useCase = { execute: vi.fn(async () => null) };
    const handler = new GetJobMatchAnalysisByIdQueryHandler(
      useCase as unknown as GetJobMatchAnalysisByIdUseCase,
    );
    const query = new GetJobMatchAnalysisByIdQuery({ id: "id-1", userId: "user-1" });

    const result = await handler.handle(query);

    expect(result).toBeNull();
    expect(useCase.execute).toHaveBeenCalledWith(query.payload);
  });
});
