import { describe, expect, it, vi } from "vitest";
import { CreateActivityContextUseCase } from "./create-activity-context.use-case";

describe("CreateActivityContextUseCase", () => {
  it("creates a non-default activity context", async () => {
    const repo = { save: vi.fn(async (context) => context) };
    const result = await new CreateActivityContextUseCase({
      activityContextRepo: repo as never,
    }).execute({ userId: "user-1", type: "employment", name: "Acme" });

    expect(result.toPrimitives()).toMatchObject({
      userId: "user-1",
      type: "employment",
      name: "Acme",
      isDefault: false,
    });
  });
});
