import { UserId } from "@/modules/shared";
import { describe, expect, it, vi } from "vitest";
import { ListActivityContextsUseCase } from "./list-activity-contexts.use-case";

describe("ListActivityContextsUseCase", () => {
  it("delegates to the repository", async () => {
    const repo = { search: vi.fn(async () => []) };
    await expect(
      new ListActivityContextsUseCase({ activityContextRepo: repo as never }).execute("user-1"),
    ).resolves.toEqual([]);
    expect(repo.search).toHaveBeenCalledWith(UserId.fromPrimitives("user-1"));
  });
});
