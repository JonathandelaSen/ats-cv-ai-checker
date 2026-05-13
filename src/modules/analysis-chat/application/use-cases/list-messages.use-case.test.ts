import { describe, expect, it, vi } from "vitest";
import type { ChatMessageRepository } from "../../domain/repositories/chat-message.repository";
import { ListMessagesUseCase } from "./list-messages.use-case";

describe("ListMessagesUseCase", () => {
  it("searches messages by user and conversation", async () => {
    const repo: ChatMessageRepository = {
      search: vi.fn(async () => []),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    await new ListMessagesUseCase({ messageRepo: repo }).execute({
      userId: "user-1",
      conversationId: "conv-1",
    });

    const criteria = vi.mocked(repo.search).mock.calls[0]?.[0];
    expect(criteria?.userId.toPrimitives()).toBe("user-1");
    expect(criteria?.conversationId.toPrimitives()).toBe("conv-1");
  });
});
