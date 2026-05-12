import { describe, expect, it } from "vitest";
import { ReceivedFeedbackId } from "./received-feedback-id.value-object";

describe("ReceivedFeedbackId", () => {
  it("wraps a non-empty id", () => {
    expect(ReceivedFeedbackId.fromPrimitives("feedback-1").toPrimitives()).toBe("feedback-1");
  });

  it("rejects blank ids", () => {
    expect(() => ReceivedFeedbackId.fromPrimitives(" ")).toThrow("empty");
  });
});
