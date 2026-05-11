import { describe, expect, it } from "vitest";
import { WorkJournalContextSuggestion } from "./context-suggestion.value-object";

describe("WorkJournalContextSuggestion", () => {
  it("round-trips suggestion primitives", () => {
    const suggestion = WorkJournalContextSuggestion.fromPrimitives({
      type: "employment",
      name: "Acme",
      roleOrLabel: "Lead",
      isCurrent: true,
      source: "cv",
    });

    expect(suggestion.toPrimitives()).toEqual({
      type: "employment",
      name: "Acme",
      roleOrLabel: "Lead",
      isCurrent: true,
      source: "cv",
    });
  });
});
