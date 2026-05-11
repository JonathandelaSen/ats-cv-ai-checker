import { describe, expect, it } from "vitest";
import { WorkJournalCreatedFromCv } from "./work-journal-created-from-cv.value-object";

describe("WorkJournalCreatedFromCv", () => {
  it("round-trips boolean values", () => {
    expect(WorkJournalCreatedFromCv.fromPrimitives(true).toPrimitives()).toBe(true);
    expect(WorkJournalCreatedFromCv.fromPrimitives(false).toPrimitives()).toBe(false);
  });
});
