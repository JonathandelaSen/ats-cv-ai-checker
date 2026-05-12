import { describe, expect, it } from "vitest";
import { CreateCommitmentUseCase } from "./create-commitment.use-case";

describe("CreateCommitmentUseCase", () => {
  it("is available for composition", () => {
    expect(CreateCommitmentUseCase).toBeDefined();
  });
});
