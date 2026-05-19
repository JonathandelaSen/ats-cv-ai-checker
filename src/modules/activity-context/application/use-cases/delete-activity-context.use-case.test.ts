import { EntityId, UserId } from "@/modules/shared";
import { describe, expect, it, vi } from "vitest";
import { ActivityContext } from "../../domain/entities/activity-context.entity";
import { DeleteActivityContextUseCase } from "./delete-activity-context.use-case";

describe("DeleteActivityContextUseCase", () => {
  it("reassigns records to General before deleting", async () => {
    const context = ActivityContext.create({
      id: EntityId.fromPrimitives("ctx-1"),
      userId: UserId.fromPrimitives("user-1"),
      type: "project",
      name: "Acme",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    });
    const general = ActivityContext.create({
      id: EntityId.fromPrimitives("ctx-general"),
      userId: UserId.fromPrimitives("user-1"),
      type: "other",
      name: "General",
      isDefault: true,
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    });
    const repo = {
      findById: vi.fn(async () => context),
      findDefault: vi.fn(async () => general),
      reassignRecordsToDefault: vi.fn(async () => 2),
      delete: vi.fn(async () => undefined),
    };

    await expect(
      new DeleteActivityContextUseCase({ activityContextRepo: repo as never }).execute({
        id: "ctx-1",
        userId: "user-1",
      }),
    ).resolves.toEqual({ reassignedRecords: 2 });
  });
});
