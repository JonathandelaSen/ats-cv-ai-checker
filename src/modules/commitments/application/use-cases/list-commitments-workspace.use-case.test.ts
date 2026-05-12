import { describe, expect, it } from "vitest";
import { ListCommitmentsWorkspaceUseCase } from "./list-commitments-workspace.use-case";

describe("ListCommitmentsWorkspaceUseCase", () => {
  it("is available for composition", () => {
    expect(ListCommitmentsWorkspaceUseCase).toBeDefined();
  });
});
