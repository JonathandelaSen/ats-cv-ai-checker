import { describe, expect, it, vi } from "vitest";
import type { EventTracker } from "@/modules/shared";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import { CreateConversationUseCase } from "./create-conversation.use-case";

describe("CreateConversationUseCase", () => {
  it("creates a conversation and records observability", async () => {
    const repo: ConversationRepository = {
      search: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(async (conversation) => conversation),
      delete: vi.fn(),
    };
    const tracker = { record: vi.fn(async () => undefined) } satisfies EventTracker;

    const conversation = await new CreateConversationUseCase({
      conversationRepo: repo,
      tracker,
    }).execute({
      userId: "user-1",
      analysisId: "analysis-1",
      title: "Chat",
      requestId: "req-1",
    });

    expect(conversation.toPrimitives()).toMatchObject({
      userId: "user-1",
      analysisReference: { type: "legacy_analysis", id: "analysis-1" },
      title: "Chat",
    });
    expect(repo.save).toHaveBeenCalledOnce();
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "analysis_chat_conversation_created",
        status: "success",
      })
    );
  });
});
