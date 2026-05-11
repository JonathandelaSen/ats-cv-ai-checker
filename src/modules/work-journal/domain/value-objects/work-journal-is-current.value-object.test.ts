import { describe, expect, it } from "vitest";
import { WorkJournalIsCurrent } from "./work-journal-is-current.value-object";

describe("WorkJournalIsCurrent", () => {
  it("round-trips boolean values", () => {
    expect(WorkJournalIsCurrent.fromPrimitives(true).toPrimitives()).toBe(true);
    expect(WorkJournalIsCurrent.fromPrimitives(false).toPrimitives()).toBe(false);
  });
});
