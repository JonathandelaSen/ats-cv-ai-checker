import { describe, expect, it } from "vitest";
import { EntityId, UserId } from "@/modules/shared";
import { CommitmentContext } from "./commitment-context.entity";

describe("CommitmentContext", () => {
  it("archives default contexts safely", () => {
    const context = CommitmentContext.create({
      id: EntityId.fromPrimitives("context-1"),
      userId: UserId.fromPrimitives("user-1"),
      type: "personal",
      name: "General",
      isDefault: true,
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-12T00:00:00.000Z",
    });

    context.archive("2026-05-13T00:00:00.000Z");

    expect(context.toPrimitives()).toMatchObject({ status: "archived", isDefault: false });
  });
});
