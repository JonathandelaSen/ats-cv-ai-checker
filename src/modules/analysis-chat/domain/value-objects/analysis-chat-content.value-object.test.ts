import { describe, expect, it } from "vitest";
import { AnalysisChatContent } from "./analysis-chat-content.value-object";

describe("AnalysisChatContent", () => {
  it("trims and round-trips content", () => {
    expect(AnalysisChatContent.fromPrimitives("  Hola  ").toPrimitives()).toBe(
      "Hola"
    );
  });

  it("rejects blank content", () => {
    expect(() => AnalysisChatContent.fromPrimitives(" ")).toThrow(
      "Analysis chat content cannot be empty"
    );
  });
});
