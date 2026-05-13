import { describe, expect, it } from "vitest";
import { AnalysisChatMessageId } from "./analysis-chat-message-id.value-object";

describe("AnalysisChatMessageId", () => {
  it("round-trips a valid id", () => {
    expect(AnalysisChatMessageId.fromPrimitives("message-1").toPrimitives()).toBe(
      "message-1"
    );
  });

  it("rejects empty ids", () => {
    expect(() => AnalysisChatMessageId.fromPrimitives(" ")).toThrow(
      "Analysis chat message id cannot be empty"
    );
  });
});
