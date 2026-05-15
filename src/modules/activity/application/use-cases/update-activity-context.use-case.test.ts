import { EntityId, UserId } from "@/modules/shared";
import { describe, expect, it, vi } from "vitest";
import { ActivityContext } from "../../domain/entities/activity-context.entity";
import { UpdateActivityContextUseCase } from "./update-activity-context.use-case";

describe("UpdateActivityContextUseCase", () => {
  it("updates an existing activity context", async () => {
    const existing = ActivityContext.create({
      id: EntityId.fromPrimitives("ctx-1"),
      userId: UserId.fromPrimitives("user-1"),
      type: "project",
      name: "Old",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    });
    const repo = {
      findById: vi.fn(async () => existing),
      save: vi.fn(async (context) => context),
    };
    const result = await new UpdateActivityContextUseCase({
      activityContextRepo: repo as never,
    }).execute({ id: "ctx-1", userId: "user-1", name: "New" });

    expect(result.toPrimitives().name).toBe("New");
  });
});
