import { GoogleGenAI } from "@google/genai";
import {
  buildWorkJournalEntryDraftPrompt,
  WORK_JOURNAL_ENTRY_SYSTEM_PROMPT,
  type WorkJournalEntryDraftPromptInput,
} from "@/lib/ai-work-journal-prompts";

export interface WorkJournalAIInput {
  apiKey: string;
  model: string;
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  return JSON.parse(rawText || "{}") as Record<string, unknown>;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseWorkJournalEntryDraftAIResponse(rawText: string): string {
  const parsed = parseJsonObject(rawText);
  const finalText = nullableString(parsed.final_text);
  if (!finalText) {
    throw new Error("La IA no pudo redactar la entrada con estas notas.");
  }
  return finalText;
}

export async function draftWorkJournalEntry(
  input: WorkJournalAIInput & WorkJournalEntryDraftPromptInput
): Promise<string> {
  const googleAI = new GoogleGenAI({ apiKey: input.apiKey });
  const response = await googleAI.models.generateContent({
    model: input.model,
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

  return parseWorkJournalEntryDraftAIResponse(response.text || "{}");
}
