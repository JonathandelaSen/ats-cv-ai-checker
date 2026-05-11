import { describe, expect, it } from "vitest";
import { Feedback } from "./feedback.entity";

const now = "2026-05-11T10:00:00.000Z";

describe("Feedback", () => {
  it("creates active feedback and records a domain event", () => {
    const feedback = Feedback.create({
      id: "fb-1",
      user_id: "user-1",
      person_name: " Jon ",
      now,
    });

    expect(feedback.toPrimitives()).toMatchObject({
      id: "fb-1",
      user_id: "user-1",
      person_name: "Jon",
      status: "active",
      final_feedback: null,
      closed_at: null,
    });
    expect(feedback.pullDomainEvents().map((event) => event.eventName)).toEqual([
      "feedback_created",
    ]);
  });

  it("closes and reopens feedback", () => {
    const feedback = Feedback.fromPrimitives({
      id: "fb-1",
      user_id: "user-1",
      person_name: "Jon",
      status: "active",
      final_feedback: null,
      closed_at: null,
      created_at: now,
      updated_at: now,
    });

    feedback.close(now);
    expect(feedback.toPrimitives()).toMatchObject({
      status: "closed",
      closed_at: now,
    });

    feedback.reopen();
    expect(feedback.toPrimitives()).toMatchObject({
      status: "active",
      closed_at: null,
    });
  });
});
