import { describe, expect, it } from "vitest";
import { DeleteCommitmentUseCase } from "./delete-commitment.use-case";

describe("DeleteCommitmentUseCase", () => {
  it("is available for composition", () => {
    expect(DeleteCommitmentUseCase).toBeDefined();
  });
});
