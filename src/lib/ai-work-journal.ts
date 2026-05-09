import { GoogleGenAI } from "@google/genai";
import {
  buildWorkJournalEntryDraftPrompt,
  buildWorkJournalHighlightsPrompt,
  WORK_JOURNAL_ENTRY_SYSTEM_PROMPT,
  WORK_JOURNAL_HIGHLIGHTS_SYSTEM_PROMPT,
  type WorkJournalEntryDraftPromptInput,
  type WorkJournalHighlightsPromptInput,
} from "@/lib/ai-work-journal-prompts";

export interface WorkJournalAIInput {
  apiKey: string;
  model: string;
}

export interface GeneratedWorkJournalHighlight {
  title: string;
  summary: string;
  date_start: string | null;
  date_end: string | null;
  source_entry_ids: string[];
  candidate_bullets: string[];
  detected_topics: string[];
  follow_up_questions: string[];
  merge_with_highlight_id: string | null;
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  return JSON.parse(rawText || "{}") as Record<string, unknown>;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
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

export function parseWorkJournalHighlightsAIResponse(
  rawText: string
): GeneratedWorkJournalHighlight[] {
  const parsed = parseJsonObject(rawText);
  const highlights = Array.isArray(parsed.highlights) ? parsed.highlights : [];

  return highlights
    .map((item): GeneratedWorkJournalHighlight | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = nullableString(row.title);
      const summary = nullableString(row.summary);
      const sourceEntryIds = stringArray(row.source_entry_ids);
      if (!title || !summary || sourceEntryIds.length === 0) return null;

      return {
        title,
        summary,
        date_start: nullableString(row.date_start),
        date_end: nullableString(row.date_end),
        source_entry_ids: sourceEntryIds,
        candidate_bullets: stringArray(row.candidate_bullets),
        detected_topics: stringArray(row.detected_topics),
        follow_up_questions: stringArray(row.follow_up_questions),
        merge_with_highlight_id: nullableString(row.merge_with_highlight_id),
      };
    })
    .filter((item): item is GeneratedWorkJournalHighlight => item !== null);
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

export async function generateWorkJournalHighlights(
  input: WorkJournalAIInput & WorkJournalHighlightsPromptInput
): Promise<GeneratedWorkJournalHighlight[]> {
  const googleAI = new GoogleGenAI({ apiKey: input.apiKey });
  const response = await googleAI.models.generateContent({
    model: input.model,
    contents: [
      {
        role: "user",
        parts: [{ text: buildWorkJournalHighlightsPrompt(input) }],
      },
    ],
    config: {
      systemInstruction: WORK_JOURNAL_HIGHLIGHTS_SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  return parseWorkJournalHighlightsAIResponse(response.text || "{}");
}

