import { describe, expect, it } from "vitest";
import { FeedbackEntry } from "./feedback-entry.entity";

describe("FeedbackEntry", () => {
  it("creates an entry and records a domain event", () => {
    const entry = FeedbackEntry.create({
      id: "entry-1",
      user_id: "user-1",
      feedback_id: "feedback-1",
      content: "  Helpful review note  ",
      now: "2026-05-11T10:00:00.000Z",
    });

    expect(entry.toPrimitives()).toMatchObject({
      id: "entry-1",
      user_id: "user-1",
      feedback_id: "feedback-1",
      content: "Helpful review note",
    });
    expect(entry.pullDomainEvents().map((event) => event.eventName)).toEqual([
      "feedback_entry_created",
    ]);
  });
});
