import { describe, expect, it } from "vitest";
import { parseFeedbackNotesFinalAIResponse } from "./ai-feedback-notes";

describe("parseFeedbackNotesFinalAIResponse", () => {
  it("extracts final feedback from JSON", () => {
    expect(
      parseFeedbackNotesFinalAIResponse(
        JSON.stringify({ final_feedback: "Useful feedback" })
      )
    ).toBe("Useful feedback");
  });

  it("throws when final feedback is missing", () => {
    expect(() => parseFeedbackNotesFinalAIResponse("{}")).toThrow(
      "La IA no pudo redactar el feedback con estas notas."
    );
  });
});
