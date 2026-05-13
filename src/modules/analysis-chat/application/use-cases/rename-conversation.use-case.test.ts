import { describe, expect, it, vi } from "vitest";
import { Timestamp, UserId } from "@/modules/shared";
import type { EventTracker } from "@/modules/shared";
import { Conversation } from "../../domain/entities/conversation.entity";
import { ConversationNotFoundError } from "../../domain/errors/conversation-not-found.error";
import type { ConversationRepository } from "../../domain/repositories/conversation.repository";
import { AnalysisChatConversationId } from "../../domain/value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatTitle } from "../../domain/value-objects/analysis-chat-title.value-object";
import { AnalysisReference } from "../../domain/value-objects/analysis-reference.value-object";
import { RenameConversationUseCase } from "./rename-conversation.use-case";

function conversation() {
  return Conversation.create({
    id: AnalysisChatConversationId.fromPrimitives("conv-1"),
    userId: UserId.fromPrimitives("user-1"),
    analysisReference: AnalysisReference.fromPrimitives({
      type: "legacy_analysis",
      id: "analysis-1",
    }),
    title: AnalysisChatTitle.fromPrimitives("Old"),
    createdAt: Timestamp.fromPrimitives("2026-05-13T10:00:00.000Z"),
    updatedAt: Timestamp.fromPrimitives("2026-05-13T10:00:00.000Z"),
  });
}

describe("RenameConversationUseCase", () => {
  it("renames and saves an existing conversation", async () => {
    const repo: ConversationRepository = {
      search: vi.fn(),
      findById: vi.fn(async () => conversation()),
      save: vi.fn(async (conv) => conv),
      delete: vi.fn(),
    };
    const tracker = { record: vi.fn(async () => undefined) } satisfies EventTracker;

    const result = await new RenameConversationUseCase({
      conversationRepo: repo,
      tracker,
    }).execute({
      userId: "user-1",
      analysisId: "analysis-1",
      conversationId: "conv-1",
      title: "New",
      requestId: "req-1",
    });

    expect(result.toPrimitives().title).toBe("New");
    expect(tracker.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "analysis_chat_conversation_renamed" })
    );
  });

  it("throws when the conversation does not exist", async () => {
    const repo: ConversationRepository = {
      search: vi.fn(),
      findById: vi.fn(async () => null),
      save: vi.fn(),
      delete: vi.fn(),
    };

    await expect(
      new RenameConversationUseCase({
        conversationRepo: repo,
        tracker: { record: vi.fn() } as unknown as EventTracker,
      }).execute({
        userId: "user-1",
        analysisId: "analysis-1",
        conversationId: "missing",
        title: "New",
        requestId: "req-1",
      })
    ).rejects.toBeInstanceOf(ConversationNotFoundError);
  });
});
