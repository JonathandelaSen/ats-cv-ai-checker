import { describe, expect, it } from "vitest";
import { AnalysisReference } from "./analysis-reference.value-object";

describe("AnalysisReference", () => {
  it("round-trips a legacy analysis reference", () => {
    expect(
      AnalysisReference.fromPrimitives({
        type: "legacy_analysis",
        id: "analysis-1",
      }).toPrimitives()
    ).toEqual({ type: "legacy_analysis", id: "analysis-1" });
  });

  it("rejects an empty analysis id", () => {
    expect(() =>
      AnalysisReference.fromPrimitives({ type: "legacy_analysis", id: " " })
    ).toThrow("Analysis reference id cannot be empty");
  });
});
