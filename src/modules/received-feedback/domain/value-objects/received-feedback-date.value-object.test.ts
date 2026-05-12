import { describe, expect, it } from "vitest";
import { ReceivedFeedbackDate } from "./received-feedback-date.value-object";

describe("ReceivedFeedbackDate", () => {
  it("accepts an ISO date that is not in the future", () => {
    expect(
      ReceivedFeedbackDate.fromPrimitives("2026-05-12", "2026-05-12").toPrimitives()
    ).toBe("2026-05-12");
  });

  it("rejects future dates", () => {
    expect(() =>
      ReceivedFeedbackDate.fromPrimitives("2026-05-13", "2026-05-12")
    ).toThrow("future");
  });
});
