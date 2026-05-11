import { GoogleGenAI } from "@google/genai";
import {
  buildFeedbackNotesFinalPrompt,
  FEEDBACK_NOTES_FINAL_SYSTEM_PROMPT,
  type FeedbackNotesFinalPromptInput,
} from "@/lib/ai-feedback-notes-prompts";

export interface FeedbackNotesAIInput {
  apiKey: string;
  model: string;
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  return JSON.parse(rawText || "{}") as Record<string, unknown>;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseFeedbackNotesFinalAIResponse(rawText: string): string {
  const parsed = parseJsonObject(rawText);
  const finalFeedback = nullableString(parsed.final_feedback);
  if (!finalFeedback) {
    throw new Error("La IA no pudo redactar el feedback con estas notas.");
  }
  return finalFeedback;
}

export async function generateFeedbackNotesFinalFeedback(
  input: FeedbackNotesAIInput & FeedbackNotesFinalPromptInput
): Promise<string> {
  const googleAI = new GoogleGenAI({ apiKey: input.apiKey });
  const response = await googleAI.models.generateContent({
    model: input.model,
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

  return parseFeedbackNotesFinalAIResponse(response.text || "{}");
}
