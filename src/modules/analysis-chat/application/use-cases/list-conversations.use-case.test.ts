import { describe, expect, it, vi } from "vitest";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import { ListConversationsUseCase } from "./list-conversations.use-case";

describe("ListConversationsUseCase", () => {
  it("searches conversations by user and legacy analysis reference", async () => {
    const repo: ConversationRepository = {
      search: vi.fn(async () => []),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    await new ListConversationsUseCase({ conversationRepo: repo }).execute({
      userId: "user-1",
      analysisId: "analysis-1",
    });

    expect(repo.search).toHaveBeenCalledWith({
      userId: expect.objectContaining({}),
      analysisReference: expect.objectContaining({}),
    });
    const criteria = vi.mocked(repo.search).mock.calls[0]?.[0];
    expect(criteria?.userId.toPrimitives()).toBe("user-1");
    expect(criteria?.analysisReference.toPrimitives()).toEqual({
      type: "job_match_analysis",
      id: "analysis-1",
    });
  });
});
