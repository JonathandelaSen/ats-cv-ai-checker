import { describe, expect, it } from "vitest";
import { WorkJournalIsDefault } from "./work-journal-is-default.value-object";

describe("WorkJournalIsDefault", () => {
  it("round-trips boolean values", () => {
    expect(WorkJournalIsDefault.fromPrimitives(true).toPrimitives()).toBe(true);
    expect(WorkJournalIsDefault.fromPrimitives(false).toPrimitives()).toBe(false);
  });
});
