import { GoogleGenAI } from "@google/genai";
import { badRequest } from "@/modules/shared";
import type {
  DraftEntryInput,
  JournalAIService,
} from "../../domain/repositories/journal-ai-service.repository";
import {
  buildWorkJournalEntryDraftPrompt,
  WORK_JOURNAL_ENTRY_SYSTEM_PROMPT,
} from "./work-journal-prompts";

export class GeminiJournalAIService implements JournalAIService {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async draftEntry(input: DraftEntryInput): Promise<string> {
    const googleAI = new GoogleGenAI({ apiKey: this.config.apiKey });
    const response = await googleAI.models.generateContent({
      model: this.config.model,
      contents: [
        {
          role: "user",
          parts: [{ text: buildWorkJournalEntryDraftPrompt(input) }],
        },
      ],
      config: {
        systemInstruction: WORK_JOURNAL_ENTRY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    return this.parseResponse(response.text || "{}");
  }

  private parseResponse(rawText: string): string {
    const parsed = JSON.parse(rawText || "{}") as Record<string, unknown>;
    const finalText =
      typeof parsed.final_text === "string" && parsed.final_text.trim()
        ? parsed.final_text.trim()
        : null;
    if (!finalText) {
      throw new Error("La IA no pudo redactar la entrada con estas notas.");
    }
    return finalText;
  }
}

export class GeminiJournalAIServiceFactory {
  create(config: { apiKey?: string; model: string }): JournalAIService {
    if (!config.apiKey) throw badRequest("API key is required for Gemini.");
    return new GeminiJournalAIService({
      apiKey: config.apiKey,
      model: config.model,
    });
  }
}
