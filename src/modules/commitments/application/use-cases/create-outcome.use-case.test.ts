import { describe, expect, it } from "vitest";
import { CreateCommitmentOutcomeUseCase } from "./create-outcome.use-case";

describe("CreateCommitmentOutcomeUseCase", () => {
  it("is available for composition", () => {
    expect(CreateCommitmentOutcomeUseCase).toBeDefined();
  });
});
