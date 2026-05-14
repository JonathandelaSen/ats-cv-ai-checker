import type { StandardCVProfile } from "../cv-profile";
import type { CVTemplateId, CVTemplateLocale } from "../cv-templates";

export interface StructuredCVProfileResult {
  schemaVersion: string;
  profile: StandardCVProfile;
}

export interface CVProfileStructuringAIService {
  structure(input: { text: string }): Promise<StructuredCVProfileResult>;
}

export interface CVProfileStructuringAIServiceFactory {
  create(config: {
    apiKey: string;
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
  create(config: { apiKey: string; model: string }): CVProfileEditingAIService;
}
