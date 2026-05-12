import { describe, expect, it } from "vitest";
import { EnsureDefaultCommitmentContextUseCase } from "./ensure-default-context.use-case";

describe("EnsureDefaultCommitmentContextUseCase", () => {
  it("is available for composition", () => {
    expect(EnsureDefaultCommitmentContextUseCase).toBeDefined();
  });
});
