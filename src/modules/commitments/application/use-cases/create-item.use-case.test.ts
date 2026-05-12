import { describe, expect, it } from "vitest";
import { CreateCommitmentItemUseCase } from "./create-item.use-case";

describe("CreateCommitmentItemUseCase", () => {
  it("is available for composition", () => {
    expect(CreateCommitmentItemUseCase).toBeDefined();
  });
});
