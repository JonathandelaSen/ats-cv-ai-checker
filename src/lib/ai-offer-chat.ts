import { GoogleGenAI } from "@google/genai";
import {
  OFFER_CHAT_SYSTEM_PROMPT,
  buildOfferChatPrompt,
  type OfferChatPromptInput,
} from "@/lib/ai-offer-chat-prompts";

export interface OfferChatAIInput extends OfferChatPromptInput {
  apiKey: string;
  model: string;
}

export function parseOfferChatAIResponse(rawText: string): string {
  const parsed = JSON.parse(rawText || "{}") as Record<string, unknown>;
  const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";

  if (!answer) {
    throw new Error("La IA no pudo generar una respuesta con este contexto.");
  }

  return answer;
}

export async function generateOfferChatAnswer(
  input: OfferChatAIInput
): Promise<string> {
  const googleAI = new GoogleGenAI({ apiKey: input.apiKey });
  const response = await googleAI.models.generateContent({
    model: input.model,
    contents: [
      {
        role: "user",
        parts: [{ text: buildOfferChatPrompt(input) }],
      },
    ],
    config: {
      systemInstruction: OFFER_CHAT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  return parseOfferChatAIResponse(response.text || "{}");
}
