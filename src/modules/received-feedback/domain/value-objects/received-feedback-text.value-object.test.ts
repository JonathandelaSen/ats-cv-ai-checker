import { describe, expect, it } from "vitest";
import { ReceivedFeedbackText } from "./received-feedback-text.value-object";

describe("ReceivedFeedbackText", () => {
  it("trims valid feedback text", () => {
    expect(ReceivedFeedbackText.fromPrimitives(" Good work. ").toPrimitives()).toBe("Good work.");
  });

  it("rejects blank feedback text", () => {
    expect(() => ReceivedFeedbackText.fromPrimitives(" ")).toThrow("empty");
  });
});
