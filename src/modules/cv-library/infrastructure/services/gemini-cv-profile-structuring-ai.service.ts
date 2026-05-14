import { GoogleGenAI } from "@google/genai";
import {
  CV_PROFILE_SCHEMA_VERSION,
  normalizeStandardCVProfile,
} from "../../domain/cv-profile";
import type {
  CVProfileStructuringAIService,
  CVProfileStructuringAIServiceFactory,
  StructuredCVProfileResult,
} from "../../domain/repositories/cv-profile-ai.service";
import { SYSTEM_PROMPT } from "./cv-profile-structuring-prompts";

class GeminiCVProfileStructuringAIService
  implements CVProfileStructuringAIService
{
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async structure(input: { text: string }): Promise<StructuredCVProfileResult> {
    const googleAI = new GoogleGenAI({ apiKey: this.config.apiKey });
    const response = await googleAI.models.generateContent({
      model: this.config.model,
      contents: [{ role: "user", parts: [{ text: input.text }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const parsed = JSON.parse(rawText) as unknown;

    return {
      schemaVersion: CV_PROFILE_SCHEMA_VERSION,
      profile: normalizeStandardCVProfile(parsed),
    };
  }
}

export class GeminiCVProfileStructuringAIServiceFactory
  implements CVProfileStructuringAIServiceFactory
{
  create(
    config: { apiKey: string; model: string },
  ): CVProfileStructuringAIService {
    return new GeminiCVProfileStructuringAIService(config);
  }
}
