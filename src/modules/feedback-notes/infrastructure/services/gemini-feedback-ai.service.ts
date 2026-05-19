import { GoogleGenAI } from "@google/genai";
import { badRequest } from "@/modules/shared";
import type {
  FeedbackAIService,
  GenerateFinalFeedbackInput,
} from "../../domain/repositories/feedback-ai-service.repository";
import {
  buildFeedbackNotesFinalPrompt,
  FEEDBACK_NOTES_FINAL_SYSTEM_PROMPT,
} from "../../domain/services/feedback-notes-prompts";
import { parseFinalFeedbackAIResponse } from "./feedback-ai-response-parser";

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

    return parseFinalFeedbackAIResponse(response.text || "{}");
  }
}

export class GeminiFeedbackAIServiceFactory {
  create(config: { apiKey?: string; model: string }): FeedbackAIService {
    if (!config.apiKey) throw badRequest("API key is required for Gemini.");
    return new GeminiFeedbackAIService({
      apiKey: config.apiKey,
      model: config.model,
    });
  }
}
