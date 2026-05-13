import { describe, expect, it } from "vitest";
import { CVAnalysisId } from "./cv-analysis-id.value-object";

describe("CVAnalysisId", () => {
  it("round-trips non-empty ids", () => {
    expect(CVAnalysisId.fromPrimitives("analysis-1").toPrimitives()).toBe("analysis-1");
  });

  it("rejects blank ids", () => {
    expect(() => CVAnalysisId.fromPrimitives(" ")).toThrow("CV analysis id is required");
  });
});
