import { describe, expect, it } from "vitest";
import { WorkJournalContextName } from "./work-journal-context-name.value-object";

describe("WorkJournalContextName", () => {
  it("round-trips a context name", () => {
    expect(WorkJournalContextName.fromPrimitives("Acme").toPrimitives()).toBe("Acme");
  });

  it("rejects blank names", () => {
    expect(() => WorkJournalContextName.fromPrimitives(" ")).toThrow();
  });
});
