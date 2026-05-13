import { describe, expect, it } from "vitest";
import { Timestamp, UserId } from "@/modules/shared";
import { Conversation } from "./conversation.entity";
import { AnalysisChatConversationId } from "../value-objects/analysis-chat-conversation-id.value-object";
import { AnalysisChatTitle } from "../value-objects/analysis-chat-title.value-object";
import { AnalysisReference } from "../value-objects/analysis-reference.value-object";

function createConversation() {
  return Conversation.create({
    id: AnalysisChatConversationId.fromPrimitives("conversation-1"),
    userId: UserId.fromPrimitives("user-1"),
    analysisReference: AnalysisReference.fromPrimitives({
      type: "legacy_analysis",
      id: "analysis-1",
    }),
    title: AnalysisChatTitle.fromPrimitives("Oferta"),
    createdAt: Timestamp.fromPrimitives("2026-05-13T10:00:00.000Z"),
    updatedAt: Timestamp.fromPrimitives("2026-05-13T10:00:00.000Z"),
  });
}

describe("Conversation", () => {
  it("creates and serializes a conversation", () => {
    expect(createConversation().toPrimitives()).toEqual({
      id: "conversation-1",
      userId: "user-1",
      analysisReference: { type: "legacy_analysis", id: "analysis-1" },
      title: "Oferta",
      createdAt: "2026-05-13T10:00:00.000Z",
      updatedAt: "2026-05-13T10:00:00.000Z",
    });
  });

  it("hydrates from primitives without recording events", () => {
    const conversation = Conversation.fromPrimitives(createConversation().toPrimitives());

    expect(conversation.pullDomainEvents()).toEqual([]);
  });

  it("renames a conversation", () => {
    const conversation = Conversation.fromPrimitives(createConversation().toPrimitives());

    conversation.rename(AnalysisChatTitle.fromPrimitives("Nueva oferta"));

    expect(conversation.toPrimitives().title).toBe("Nueva oferta");
  });
});
