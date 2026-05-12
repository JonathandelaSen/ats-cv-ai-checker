import { describe, expect, it } from "vitest";
import { UpdateCommitmentUseCase } from "./update-commitment.use-case";

describe("UpdateCommitmentUseCase", () => {
  it("is available for composition", () => {
    expect(UpdateCommitmentUseCase).toBeDefined();
  });
});
