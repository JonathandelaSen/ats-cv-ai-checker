import { describe, expect, it } from "vitest";
import { AIModelName } from "./ai-model-name.value-object";

describe("AIModelName", () => {
  it("round-trips a model name", () => {
    expect(AIModelName.fromPrimitives("gemini-3.1-pro-preview").toPrimitives()).toBe("gemini-3.1-pro-preview");
  });

  it("allows an empty model for legacy records", () => {
    expect(AIModelName.fromPrimitives("").toPrimitives()).toBe("");
  });
});
