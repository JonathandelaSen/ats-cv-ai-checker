import { describe, expect, it } from "vitest";
import { WorkJournalSuggestionSource } from "./work-journal-suggestion-source.value-object";

describe("WorkJournalSuggestionSource", () => {
  it("accepts CV as the source", () => {
    expect(WorkJournalSuggestionSource.fromPrimitives("cv").toPrimitives()).toBe("cv");
  });

  it("rejects unsupported sources", () => {
    expect(() => WorkJournalSuggestionSource.fromPrimitives("manual" as never)).toThrow();
  });
});
