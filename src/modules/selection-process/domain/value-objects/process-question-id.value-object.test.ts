import { describe, expect, it } from "vitest";
import { ProcessQuestionId } from "./process-question-id.value-object";

describe("ProcessQuestionId", () => {
  it("round-trips non-empty ids", () => {
    expect(ProcessQuestionId.fromPrimitives("question-1").toPrimitives()).toBe("question-1");
  });
});
