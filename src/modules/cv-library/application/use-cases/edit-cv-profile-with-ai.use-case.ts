import type { StandardCVProfile } from "../../domain/cv-profile";
import type { CVTemplateId, CVTemplateLocale } from "../../domain/cv-templates";
import type { CVProfileEditingAIServiceFactory } from "../../domain/repositories/cv-profile-ai.service";

export interface EditCVProfileWithAIInput {
  apiKey: string;
  model: string;
  profile: StandardCVProfile;
  instruction: string;
  templateId?: CVTemplateId;
  locale?: CVTemplateLocale;
  recommendations?: string[];
}

export class EditCVProfileWithAIUseCase {
  constructor(
    private readonly deps: {
      aiFactory: CVProfileEditingAIServiceFactory;
    },
  ) {}

  async execute(input: EditCVProfileWithAIInput): Promise<StandardCVProfile> {
    const service = this.deps.aiFactory.create({
      apiKey: input.apiKey,
      model: input.model,
    });

    return service.edit({
      profile: input.profile,
      instruction: input.instruction,
      templateId: input.templateId,
      locale: input.locale,
      recommendations: input.recommendations,
    });
  }
}
