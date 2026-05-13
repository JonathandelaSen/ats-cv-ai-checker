import { describe, expect, it } from "vitest";
import { AnalysisChatTitle } from "./analysis-chat-title.value-object";

describe("AnalysisChatTitle", () => {
  it("trims a valid title", () => {
    expect(AnalysisChatTitle.fromPrimitives("  Conversación  ").toPrimitives()).toBe(
      "Conversación"
    );
  });

  it("rejects blank titles", () => {
    expect(() => AnalysisChatTitle.fromPrimitives(" ")).toThrow(
      "Analysis chat title cannot be empty"
    );
  });
});
