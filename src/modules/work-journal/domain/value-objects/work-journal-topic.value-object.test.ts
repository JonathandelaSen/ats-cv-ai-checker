import { describe, expect, it } from "vitest";
import { WorkJournalTopic } from "./work-journal-topic.value-object";

describe("WorkJournalTopic", () => {
  it("trims text and normalizes blank values to null", () => {
    expect(WorkJournalTopic.fromPrimitives(" Launch ").toPrimitives()).toBe("Launch");
    expect(WorkJournalTopic.fromPrimitives(" ").toPrimitives()).toBeNull();
  });
});
