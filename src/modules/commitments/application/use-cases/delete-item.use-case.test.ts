import { describe, expect, it } from "vitest";
import { DeleteCommitmentItemUseCase } from "./delete-item.use-case";

describe("DeleteCommitmentItemUseCase", () => {
  it("is available for composition", () => {
    expect(DeleteCommitmentItemUseCase).toBeDefined();
  });
});
