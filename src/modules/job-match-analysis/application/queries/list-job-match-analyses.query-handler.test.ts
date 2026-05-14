import { describe, it, expect, vi } from "vitest";
import { ListJobMatchAnalysesQueryHandler } from "./list-job-match-analyses.query-handler";
import { ListJobMatchAnalysesQuery } from "./list-job-match-analyses.query";

describe("ListJobMatchAnalysesQueryHandler", () => {
  it("should return empty array when use case returns no entities", async () => {
    const useCase = { execute: vi.fn(async () => []) };
    const handler = new ListJobMatchAnalysesQueryHandler(useCase as any);
    const query = new ListJobMatchAnalysesQuery({ userId: "user-1" });

    const result = await handler.handle(query);

    expect(result).toEqual([]);
    expect(useCase.execute).toHaveBeenCalledWith(query.payload);
  });
});
