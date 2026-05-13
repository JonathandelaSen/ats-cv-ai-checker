import { describe, expect, it } from "vitest";
import { AnalysisChatRole } from "./analysis-chat-role.value-object";

describe("AnalysisChatRole", () => {
  it("accepts user and assistant roles", () => {
    expect(AnalysisChatRole.fromPrimitives("user").toPrimitives()).toBe("user");
    expect(AnalysisChatRole.fromPrimitives("assistant").toPrimitives()).toBe(
      "assistant"
    );
  });

  it("rejects unsupported roles", () => {
    expect(() => AnalysisChatRole.fromPrimitives("system")).toThrow(
      "Analysis chat role must be user or assistant"
    );
  });
});
