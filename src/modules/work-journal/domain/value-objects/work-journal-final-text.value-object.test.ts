import { describe, expect, it } from "vitest";
import { WorkJournalFinalText } from "./work-journal-final-text.value-object";

describe("WorkJournalFinalText", () => {
  it("round-trips final text", () => {
    expect(WorkJournalFinalText.fromPrimitives("Final text").toPrimitives()).toBe(
      "Final text"
    );
  });

  it("rejects blank final text", () => {
    expect(() => WorkJournalFinalText.fromPrimitives(" ")).toThrow();
  });
});
