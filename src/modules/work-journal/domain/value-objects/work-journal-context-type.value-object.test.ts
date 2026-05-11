import { describe, expect, it } from "vitest";
import { WorkJournalContextType } from "./work-journal-context-type.value-object";

describe("WorkJournalContextType", () => {
  it("accepts supported context types", () => {
    expect(WorkJournalContextType.fromPrimitives("employment").toPrimitives()).toBe("employment");
    expect(WorkJournalContextType.fromPrimitives("project").toPrimitives()).toBe("project");
  });

  it("rejects unsupported context types", () => {
    expect(() => WorkJournalContextType.fromPrimitives("other" as never)).toThrow();
  });
});
