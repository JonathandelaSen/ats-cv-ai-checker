import { describe, expect, it } from "vitest";
import { ReceivedFeedbackGiverName } from "./received-feedback-giver-name.value-object";

describe("ReceivedFeedbackGiverName", () => {
  it("trims valid giver names", () => {
    expect(ReceivedFeedbackGiverName.fromPrimitives(" Manager ").toPrimitives()).toBe("Manager");
  });

  it("rejects blank giver names", () => {
    expect(() => ReceivedFeedbackGiverName.fromPrimitives(" ")).toThrow("empty");
  });
});
