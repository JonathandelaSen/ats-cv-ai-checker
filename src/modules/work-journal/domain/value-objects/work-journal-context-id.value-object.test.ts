import { describe, expect, it } from "vitest";
import { WorkJournalContextId } from "./work-journal-context-id.value-object";

describe("WorkJournalContextId", () => {
  it("round-trips a context id", () => {
    expect(WorkJournalContextId.fromPrimitives("ctx-1").toPrimitives()).toBe("ctx-1");
  });

  it("rejects empty ids", () => {
    expect(() => WorkJournalContextId.fromPrimitives(" ")).toThrow();
  });
});
