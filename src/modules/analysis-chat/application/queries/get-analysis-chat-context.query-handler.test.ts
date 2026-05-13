import { describe, expect, it, vi } from "vitest";
import { GetAnalysisChatContextUseCase } from "../use-cases/get-analysis-chat-context.use-case";
import { GetAnalysisChatContextQuery } from "./get-analysis-chat-context.query";
import { GetAnalysisChatContextQueryHandler } from "./get-analysis-chat-context.query-handler";

describe("GetAnalysisChatContextQueryHandler", () => {
  it("delegates to the matching use case", async () => {
    const useCase = {
      execute: vi.fn(async () => null),
    } as unknown as GetAnalysisChatContextUseCase;
    const handler = new GetAnalysisChatContextQueryHandler(useCase);

    await handler.handle(
      new GetAnalysisChatContextQuery({
        analysisId: "analysis-1",
        userId: "user-1",
      }),
    );

    expect(useCase.execute).toHaveBeenCalledWith({
      analysisId: "analysis-1",
      userId: "user-1",
    });
  });
});
