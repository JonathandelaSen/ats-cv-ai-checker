import { describe, expect, it } from "vitest";
import { ProcessQuestionText } from "./process-question-text.value-object";

describe("ProcessQuestionText", () => {
  it("trims text", () => {
    expect(ProcessQuestionText.fromPrimitives("  Why us?  ").toPrimitives()).toBe("Why us?");
  });

  it("rejects blank text", () => {
    expect(() => ProcessQuestionText.fromPrimitives("")).toThrow("Process question text is required");
  });
});
