import { describe, expect, it } from "vitest";
import { UpdateCommitmentContextUseCase } from "./update-context.use-case";

describe("UpdateCommitmentContextUseCase", () => {
  it("is available for composition", () => {
    expect(UpdateCommitmentContextUseCase).toBeDefined();
  });
});
