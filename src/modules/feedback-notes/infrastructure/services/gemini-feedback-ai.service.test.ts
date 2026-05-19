import { describe, expect, it } from "vitest";
import { parseFinalFeedbackAIResponse } from "./feedback-ai-response-parser";

describe("GeminiFeedbackAIService.parseFinalAIResponse", () => {
  it("extracts final feedback from JSON", () => {
    expect(
      parseFinalFeedbackAIResponse(
        JSON.stringify({ final_feedback: "Useful feedback" })
      )
    ).toBe("Useful feedback");
  });

  it("throws when final feedback is missing", () => {
    expect(() =>
      parseFinalFeedbackAIResponse("{}")
    ).toThrow("La IA no pudo redactar el feedback con estas notas.");
  });
});
