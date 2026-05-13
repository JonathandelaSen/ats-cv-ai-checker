import { describe, expect, it, vi } from "vitest";
import type { EventTracker } from "@/modules/shared";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import { DeleteConversationUseCase } from "./delete-conversation.use-case";

describe("DeleteConversationUseCase", () => {
  it("deletes by id and records observability", async () => {
    const repo: ConversationRepository = {
      search: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(async () => undefined),
    };
    const tracker = { record: vi.fn(async () => undefined) } satisfies EventTracker;

    await new DeleteConversationUseCase({ conversationRepo: repo, tracker }).execute({
      userId: "user-1",
      analysisId: "analysis-1",
      conversationId: "conv-1",
      requestId: "req-1",
    });

    expect(repo.delete).toHaveBeenCalledOnce();
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "analysis_chat_conversation_deleted" })
    );
  });
});
