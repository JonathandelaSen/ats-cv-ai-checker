import { describe, expect, it } from "vitest";
import { WorkJournalNotes } from "./work-journal-notes.value-object";

describe("WorkJournalNotes", () => {
  it("round-trips notes", () => {
    expect(WorkJournalNotes.fromPrimitives("Raw notes").toPrimitives()).toBe("Raw notes");
  });

  it("rejects blank notes", () => {
    expect(() => WorkJournalNotes.fromPrimitives(" ")).toThrow();
  });
});
