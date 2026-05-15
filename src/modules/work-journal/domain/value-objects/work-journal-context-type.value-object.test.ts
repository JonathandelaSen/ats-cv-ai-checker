import { describe, expect, it } from "vitest";
import { WorkJournalContextType } from "./work-journal-context-type.value-object";

describe("WorkJournalContextType", () => {
  it("accepts supported context types", () => {
    expect(WorkJournalContextType.fromPrimitives("employment").toPrimitives()).toBe("employment");
    expect(WorkJournalContextType.fromPrimitives("project").toPrimitives()).toBe("project");
    expect(WorkJournalContextType.fromPrimitives("other").toPrimitives()).toBe("other");
  });

  it("rejects unsupported context types", () => {
    expect(() => WorkJournalContextType.fromPrimitives("unsupported" as never)).toThrow();
  });
});
