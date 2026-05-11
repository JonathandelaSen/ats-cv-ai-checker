import { describe, expect, it } from "vitest";
import { WorkJournalRoleOrLabel } from "./work-journal-role-or-label.value-object";

describe("WorkJournalRoleOrLabel", () => {
  it("trims text and normalizes blank values to null", () => {
    expect(WorkJournalRoleOrLabel.fromPrimitives(" Lead ").toPrimitives()).toBe("Lead");
    expect(WorkJournalRoleOrLabel.fromPrimitives(" ").toPrimitives()).toBeNull();
  });
});
