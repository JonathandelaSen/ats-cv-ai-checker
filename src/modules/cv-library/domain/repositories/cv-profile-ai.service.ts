import type { StandardCVProfile } from "../cv-profile";
import type { CVTemplateId, CVTemplateLocale } from "../cv-templates";
import type { AIProvider } from "@/modules/shared";

export interface StructuredCVProfileResult {
  schemaVersion: string;
  profile: StandardCVProfile;
}

export interface CVProfileStructuringAIService {
  structure(input: { text: string }): Promise<StructuredCVProfileResult>;
}

export interface CVProfileStructuringAIServiceFactory {
  create(config: {
    provider: AIProvider;
    apiKey?: string;
    model: string;
  }): CVProfileStructuringAIService;
}

export interface CVProfileEditingAIService {
  edit(input: {
    profile: StandardCVProfile;
    instruction: string;
    templateId?: CVTemplateId;
    locale?: CVTemplateLocale;
    recommendations?: string[];
  }): Promise<StandardCVProfile>;
}

export interface CVProfileEditingAIServiceFactory {
  create(config: {
    provider: AIProvider;
    apiKey?: string;
    model: string;
  }): CVProfileEditingAIService;
}
