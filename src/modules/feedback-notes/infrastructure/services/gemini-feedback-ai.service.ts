import { GoogleGenAI } from "@google/genai";
import type {
  FeedbackAIService,
  GenerateFinalFeedbackInput,
} from "../../domain/repositories/feedback-ai-service.repository";
import {
  buildFeedbackNotesFinalPrompt,
  FEEDBACK_NOTES_FINAL_SYSTEM_PROMPT,
} from "./feedback-notes-prompts";

export class GeminiFeedbackAIService implements FeedbackAIService {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async generateFinalFeedback(
    input: GenerateFinalFeedbackInput
  ): Promise<string> {
    const googleAI = new GoogleGenAI({ apiKey: this.config.apiKey });
    const response = await googleAI.models.generateContent({
      model: this.config.model,
      contents: [
        {
          role: "user",
          parts: [{ text: buildFeedbackNotesFinalPrompt(input) }],
        },
      ],
      config: {
        systemInstruction: FEEDBACK_NOTES_FINAL_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    return GeminiFeedbackAIService.parseFinalAIResponse(
      response.text || "{}"
    );
  }

  static parseFinalAIResponse(rawText: string): string {
    const parsed = JSON.parse(rawText || "{}") as Record<string, unknown>;
    const value = parsed.final_feedback;
    const finalFeedback =
      typeof value === "string" && value.trim() ? value.trim() : null;
    if (!finalFeedback) {
      throw new Error("La IA no pudo redactar el feedback con estas notas.");
    }
    return finalFeedback;
  }
}
