import { GoogleGenAI } from "@google/genai";
import { badRequest } from "@/modules/shared";
import {
  normalizeStandardCVProfile,
  type StandardCVProfile,
} from "../../domain/cv-profile";
import type { CVTemplateId, CVTemplateLocale } from "../../domain/cv-templates";
import type {
  CVProfileEditingAIService,
} from "../../domain/repositories/cv-profile-ai.service";
import { SYSTEM_PROMPT } from "./cv-profile-editing-prompts";

export interface AICVEditInput {
  apiKey: string;
  model: string;
  profile: StandardCVProfile;
  instruction: string;
  templateId?: CVTemplateId;
  locale?: CVTemplateLocale;
  recommendations?: string[];
}

export function parseEditedCVProfile(rawText: string): StandardCVProfile {
  const parsed = JSON.parse(rawText || "{}") as unknown;
  const normalized = normalizeStandardCVProfile(parsed);
  const hasContent =
    Boolean(normalized.summary) ||
    Object.keys(normalized.basics ?? {}).length > 0 ||
    Boolean(normalized.experience?.length) ||
    Boolean(normalized.education?.length) ||
    Boolean(normalized.skills?.length) ||
    Boolean(normalized.technicalSkills?.length);

  if (!hasContent) {
    throw new Error("AI response did not contain a usable CV profile.");
  }

  return normalized;
}

class GeminiCVProfileEditingAIService implements CVProfileEditingAIService {
  constructor(private readonly config: { apiKey: string; model: string }) {}

  async edit(
    input: Omit<AICVEditInput, "apiKey" | "model">,
  ): Promise<StandardCVProfile> {
    const googleAI = new GoogleGenAI({ apiKey: this.config.apiKey });
    const recommendations = input.recommendations?.length
      ? `\nRelevant recommendations from previous analysis:\n${input.recommendations
          .map((item) => `- ${item}`)
          .join("\n")}`
      : "";

    const response = await googleAI.models.generateContent({
      model: this.config.model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Instruction:\n${input.instruction}\n\nTemplate context:\n${input.templateId ?? "unknown"} / ${input.locale ?? "es"}${recommendations}\n\nStructured CV profile JSON:\n${JSON.stringify(input.profile)}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    return {
      ...parseEditedCVProfile(response.text || "{}"),
      presentation: input.profile.presentation,
    };
  }
}

export class GeminiCVProfileEditingAIServiceFactory
{
  create(config: { apiKey?: string; model: string }): CVProfileEditingAIService {
    if (!config.apiKey) throw badRequest("API key is required for Gemini.");
    return new GeminiCVProfileEditingAIService({
      apiKey: config.apiKey,
      model: config.model,
    });
  }
}
