import { GoogleGenAI } from "@google/genai";
import type { Analysis, CVRecord } from "@/lib/analysis-types";
import { badRequest } from "@/modules/shared";
import {
  OFFER_CHAT_SYSTEM_PROMPT,
  buildOfferChatPrompt,
  type OfferChatHistoryMessage,
} from "./analysis-chat-prompts";
import type {
  AnalysisChatAIInput,
  AnalysisChatAIService,
} from "../../domain/repositories/analysis-chat-ai-service.repository";

export class GeminiAnalysisChatAIService implements AnalysisChatAIService {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async generateAnswer(input: AnalysisChatAIInput): Promise<string> {
    const promptInput = {
      message: input.message,
      analysis: input.context.analysis as Analysis,
      cv: input.context.cv as CVRecord | null,
      cvText: input.context.cvText,
      history: input.history.map((message) => ({
        role: message.role,
        content: message.content,
      })) satisfies OfferChatHistoryMessage[],
    };

    const googleAI = new GoogleGenAI({ apiKey: this.config.apiKey });
    const response = await googleAI.models.generateContent({
      model: this.config.model,
      contents: [
        {
          role: "user",
          parts: [{ text: buildOfferChatPrompt(promptInput) }],
        },
      ],
      config: {
        systemInstruction: OFFER_CHAT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    return this.parseResponse(response.text || "{}");
  }

  private parseResponse(rawText: string): string {
    const parsed = JSON.parse(rawText || "{}") as Record<string, unknown>;
    const answer =
      typeof parsed.answer === "string" ? parsed.answer.trim() : "";

    if (!answer) {
      throw new Error("La IA no pudo generar una respuesta con este contexto.");
    }

    return answer;
  }
}

export class GeminiAnalysisChatAIServiceFactory {
  create(config: { apiKey?: string; model: string }): AnalysisChatAIService {
    if (!config.apiKey) throw badRequest("API key is required for Gemini.");
    return new GeminiAnalysisChatAIService({
      apiKey: config.apiKey,
      model: config.model,
    });
  }
}
