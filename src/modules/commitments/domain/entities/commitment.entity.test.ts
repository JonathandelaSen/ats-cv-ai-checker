import { describe, expect, it } from "vitest";
import { EntityId, UserId } from "@/modules/shared";
import { Commitment } from "./commitment.entity";

describe("Commitment", () => {
  it("creates and serializes an objective", () => {
    const commitment = Commitment.create({
      id: EntityId.fromPrimitives("commitment-1"),
      userId: UserId.fromPrimitives("user-1"),
      contextId: EntityId.fromPrimitives("context-1"),
      title: "Lead onboarding",
      source: "manager",
      startDate: "2026-05-12",
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-12T00:00:00.000Z",
    });

    expect(commitment.toPrimitives()).toMatchObject({
      title: "Lead onboarding",
      source: "manager",
      status: "active",
    });
    expect(commitment.pullDomainEvents()).toHaveLength(1);
  });

  it("rejects invalid date ranges", () => {
    expect(() =>
      Commitment.create({
        id: EntityId.fromPrimitives("commitment-1"),
        userId: UserId.fromPrimitives("user-1"),
        contextId: EntityId.fromPrimitives("context-1"),
        title: "Lead onboarding",
        source: "manager",
        startDate: "2026-05-12",
        targetDate: "2026-05-01",
        createdAt: "2026-05-12T00:00:00.000Z",
        updatedAt: "2026-05-12T00:00:00.000Z",
      })
    ).toThrow("Target date");
  });
});
