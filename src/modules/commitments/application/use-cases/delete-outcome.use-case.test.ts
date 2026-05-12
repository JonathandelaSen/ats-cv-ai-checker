import { describe, expect, it } from "vitest";
import { DeleteCommitmentOutcomeUseCase } from "./delete-outcome.use-case";

describe("DeleteCommitmentOutcomeUseCase", () => {
  it("is available for composition", () => {
    expect(DeleteCommitmentOutcomeUseCase).toBeDefined();
  });
});
