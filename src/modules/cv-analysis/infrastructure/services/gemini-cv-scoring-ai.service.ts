import { GoogleGenAI } from "@google/genai";
import type {
  CVScoringAIInput,
  CVScoringAIResult,
  CVScoringAIService,
  CVScoringAIServiceFactory,
} from "../../domain/repositories/cv-scoring-ai.service";
import { buildGeneralScoringPrompt } from "./cv-scoring-prompts";

function cleanArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseResult(rawText: string): CVScoringAIResult {
  const parsed = JSON.parse(rawText || "{}") as Record<string, unknown>;
  const keywordsFound = cleanArray(parsed.keywordsFound);
  const cvKeywords = cleanArray(parsed.cvKeywords);

  return {
    score: typeof parsed.score === "number" ? parsed.score : 0,
    feedback:
      typeof parsed.feedback === "string"
        ? parsed.feedback
        : "No se pudo generar feedback.",
    keywords: cvKeywords.length > 0 ? cvKeywords : keywordsFound,
    improvements: cleanArray(parsed.improvements),
  };
}

class GeminiCVScoringAIService implements CVScoringAIService {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async score(input: CVScoringAIInput): Promise<CVScoringAIResult> {
    const googleAI = new GoogleGenAI({ apiKey: this.config.apiKey });
    const response = await googleAI.models.generateContent({
      model: this.config.model,
      contents: [{ role: "user", parts: [{ text: input.text }] }],
      config: {
        systemInstruction: buildGeneralScoringPrompt(input.additionalContext),
        responseMimeType: "application/json",
      },
    });

    return parseResult(response.text || "{}");
  }
}

export class GeminiCVScoringAIServiceFactory
  implements CVScoringAIServiceFactory
{
  create(config: { apiKey: string; model: string }): CVScoringAIService {
    return new GeminiCVScoringAIService(config);
  }
}
