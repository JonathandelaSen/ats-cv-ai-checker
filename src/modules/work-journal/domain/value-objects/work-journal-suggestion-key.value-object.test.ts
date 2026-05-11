import { describe, expect, it } from "vitest";
import { WorkJournalSuggestionKey } from "./work-journal-suggestion-key.value-object";

describe("WorkJournalSuggestionKey", () => {
  it("round-trips a suggestion key", () => {
    expect(WorkJournalSuggestionKey.fromPrimitives("project:tools").toPrimitives()).toBe(
      "project:tools"
    );
  });

  it("rejects blank keys", () => {
    expect(() => WorkJournalSuggestionKey.fromPrimitives(" ")).toThrow();
  });
});
