import { describe, expect, it } from "vitest";
import { CreateCommitmentContextUseCase } from "./create-context.use-case";

describe("CreateCommitmentContextUseCase", () => {
  it("is available for composition", () => {
    expect(CreateCommitmentContextUseCase).toBeDefined();
  });
});
