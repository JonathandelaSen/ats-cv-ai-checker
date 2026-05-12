import { describe, expect, it } from "vitest";
import { EntityId, UserId } from "@/modules/shared";
import { CommitmentItem } from "./commitment-item.entity";

describe("CommitmentItem", () => {
  it("updates item status and completion", () => {
    const item = CommitmentItem.create({
      id: EntityId.fromPrimitives("item-1"),
      userId: UserId.fromPrimitives("user-1"),
      commitmentId: EntityId.fromPrimitives("commitment-1"),
      title: "Publish checklist",
      orderIndex: 0,
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-12T00:00:00.000Z",
    });

    item.update({ status: "done", completedAt: "2026-05-13T00:00:00.000Z", updatedAt: "2026-05-13T00:00:00.000Z" });

    expect(item.toPrimitives()).toMatchObject({ status: "done", completedAt: "2026-05-13T00:00:00.000Z" });
  });
});
