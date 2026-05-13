import { describe, expect, it, vi } from "vitest";
import { GetLegacyAnalysisChatContextUseCase } from "../use-cases/get-legacy-analysis-chat-context.use-case";
import { GetLegacyAnalysisChatContextQuery } from "./get-legacy-analysis-chat-context.query";
import { GetLegacyAnalysisChatContextQueryHandler } from "./get-legacy-analysis-chat-context.query-handler";

describe("GetLegacyAnalysisChatContextQueryHandler", () => {
  it("delegates to the matching use case", async () => {
    const useCase = {
      execute: vi.fn(async () => null),
    } as unknown as GetLegacyAnalysisChatContextUseCase;
    const handler = new GetLegacyAnalysisChatContextQueryHandler(useCase);

    await handler.handle(
      new GetLegacyAnalysisChatContextQuery({
        analysisId: "analysis-1",
        userId: "user-1",
      })
    );

    expect(useCase.execute).toHaveBeenCalledWith({
      analysisId: "analysis-1",
      userId: "user-1",
    });
  });
});
