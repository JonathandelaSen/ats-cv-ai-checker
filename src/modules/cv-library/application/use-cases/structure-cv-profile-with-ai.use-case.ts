import type { StandardCVProfile } from "../../domain/cv-profile";
import type { CVProfileStructuringAIServiceFactory } from "../../domain/repositories/cv-profile-ai.service";

export interface StructureCVProfileWithAIInput {
  apiKey: string;
  model: string;
  text: string;
}

export interface StructureCVProfileWithAIResult {
  schemaVersion: string;
  profile: StandardCVProfile;
}

export class StructureCVProfileWithAIUseCase {
  constructor(
    private readonly deps: {
      aiFactory: CVProfileStructuringAIServiceFactory;
    },
  ) {}

  async execute(
    input: StructureCVProfileWithAIInput,
  ): Promise<StructureCVProfileWithAIResult> {
    const service = this.deps.aiFactory.create({
      apiKey: input.apiKey,
      model: input.model,
    });

    return service.structure({ text: input.text });
  }
}
