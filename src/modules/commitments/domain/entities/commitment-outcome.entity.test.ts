import { describe, expect, it } from "vitest";
import { EntityId, UserId } from "@/modules/shared";
import { CommitmentOutcome } from "./commitment-outcome.entity";

describe("CommitmentOutcome", () => {
  it("normalizes currencies", () => {
    const outcome = CommitmentOutcome.create({
      id: EntityId.fromPrimitives("outcome-1"),
      userId: UserId.fromPrimitives("user-1"),
      commitmentId: EntityId.fromPrimitives("commitment-1"),
      type: "money",
      title: "Annual bonus",
      amount: 2000,
      currency: "eur",
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-12T00:00:00.000Z",
    });

    expect(outcome.toPrimitives()).toMatchObject({ currency: "EUR", amount: 2000 });
  });
});
