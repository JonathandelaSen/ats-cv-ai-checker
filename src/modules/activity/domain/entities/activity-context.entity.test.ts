import { EntityId, UserId } from "@/modules/shared";
import { describe, expect, it } from "vitest";
import { ActivityContext } from "./activity-context.entity";

describe("ActivityContext", () => {
  it("creates and serializes an activity context", () => {
    const context = ActivityContext.create({
      id: EntityId.fromPrimitives("ctx-1"),
      userId: UserId.fromPrimitives("user-1"),
      type: "project",
      name: "Acme - TL",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    });

    expect(context.toPrimitives()).toMatchObject({
      id: "ctx-1",
      userId: "user-1",
      type: "project",
      name: "Acme - TL",
      status: "active",
      isDefault: false,
    });
  });
});
