import { describe, expect, it } from "vitest";
import { UpdateCommitmentItemUseCase } from "./update-item.use-case";

describe("UpdateCommitmentItemUseCase", () => {
  it("is available for composition", () => {
    expect(UpdateCommitmentItemUseCase).toBeDefined();
  });
});
