import { describe, expect, it } from "vitest";
import { WorkJournalInputMode } from "./work-journal-input-mode.value-object";

describe("WorkJournalInputMode", () => {
  it("accepts supported input modes", () => {
    expect(WorkJournalInputMode.fromPrimitives("manual").toPrimitives()).toBe("manual");
    expect(WorkJournalInputMode.fromPrimitives("ai_assisted").toPrimitives()).toBe(
      "ai_assisted"
    );
  });

  it("rejects unsupported input modes", () => {
    expect(() => WorkJournalInputMode.fromPrimitives("voice" as never)).toThrow();
  });
});
