import { describe, expect, it } from "vitest";
import { WorkJournalEntryId } from "./work-journal-entry-id.value-object";

describe("WorkJournalEntryId", () => {
  it("round-trips an entry id", () => {
    expect(WorkJournalEntryId.fromPrimitives("entry-1").toPrimitives()).toBe("entry-1");
  });

  it("rejects empty ids", () => {
    expect(() => WorkJournalEntryId.fromPrimitives(" ")).toThrow();
  });
});
