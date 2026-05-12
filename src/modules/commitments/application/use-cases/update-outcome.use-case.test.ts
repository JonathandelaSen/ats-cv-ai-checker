import { describe, expect, it } from "vitest";
import { UpdateCommitmentOutcomeUseCase } from "./update-outcome.use-case";

describe("UpdateCommitmentOutcomeUseCase", () => {
  it("is available for composition", () => {
    expect(UpdateCommitmentOutcomeUseCase).toBeDefined();
  });
});
