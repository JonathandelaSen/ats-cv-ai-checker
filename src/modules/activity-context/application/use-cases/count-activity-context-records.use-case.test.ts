import { describe, expect, it, vi } from "vitest";
import { CountActivityContextRecordsUseCase } from "./count-activity-context-records.use-case";

describe("CountActivityContextRecordsUseCase", () => {
  it("delegates to the repository", async () => {
    const repo = { countAssignedRecords: vi.fn(async () => 3) };
    await expect(
      new CountActivityContextRecordsUseCase({
        activityContextRepo: repo as never,
      }).execute({ id: "ctx-1", userId: "user-1" }),
    ).resolves.toBe(3);
  });
});
