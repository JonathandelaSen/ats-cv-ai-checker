import { describe, expect, it } from "vitest";
import { WorkJournalContextStatus } from "./work-journal-context-status.value-object";

describe("WorkJournalContextStatus", () => {
  it("knows whether the status is active", () => {
    expect(WorkJournalContextStatus.fromPrimitives("active").isActive()).toBe(true);
    expect(WorkJournalContextStatus.fromPrimitives("archived").isActive()).toBe(false);
  });

  it("rejects unsupported statuses", () => {
    expect(() => WorkJournalContextStatus.fromPrimitives("deleted" as never)).toThrow();
  });
});
