import { describe, expect, it } from "vitest";
import { GeminiFeedbackAIService } from "./gemini-feedback-ai.service";

describe("GeminiFeedbackAIService.parseFinalAIResponse", () => {
  it("extracts final feedback from JSON", () => {
    expect(
      GeminiFeedbackAIService.parseFinalAIResponse(
        JSON.stringify({ final_feedback: "Useful feedback" })
      )
    ).toBe("Useful feedback");
  });

  it("throws when final feedback is missing", () => {
    expect(() =>
      GeminiFeedbackAIService.parseFinalAIResponse("{}")
    ).toThrow("La IA no pudo redactar el feedback con estas notas.");
  });
});
