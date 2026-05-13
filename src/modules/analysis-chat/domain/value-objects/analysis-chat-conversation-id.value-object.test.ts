import { describe, expect, it } from "vitest";
import { AnalysisChatConversationId } from "./analysis-chat-conversation-id.value-object";

describe("AnalysisChatConversationId", () => {
  it("round-trips a valid id", () => {
    expect(AnalysisChatConversationId.fromPrimitives("conversation-1").toPrimitives()).toBe(
      "conversation-1"
    );
  });

  it("rejects empty ids", () => {
    expect(() => AnalysisChatConversationId.fromPrimitives(" ")).toThrow(
      "Analysis chat conversation id cannot be empty"
    );
  });
});
