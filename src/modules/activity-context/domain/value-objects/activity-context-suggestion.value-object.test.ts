import { ActivityContextSuggestion } from "./activity-context-suggestion.value-object";
import { describe, expect, it } from "vitest";

describe("ActivityContextSuggestion", () => {
  it("round-trips suggestion primitives", () => {
    const suggestion = ActivityContextSuggestion.fromPrimitives({
      type: "employment",
      name: "Acme",
      roleOrLabel: "Product Manager",
      isCurrent: true,
      source: "cv",
    });

    expect(suggestion.toPrimitives()).toEqual({
      type: "employment",
      name: "Acme",
      roleOrLabel: "Product Manager",
      isCurrent: true,
      source: "cv",
    });
  });
});
