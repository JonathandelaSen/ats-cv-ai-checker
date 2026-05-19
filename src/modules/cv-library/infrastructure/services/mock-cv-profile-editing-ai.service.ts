import type { StandardCVProfile } from "../../domain/cv-profile";
import type { CVProfileEditingAIService } from "../../domain/repositories/cv-profile-ai.service";

class MockCVProfileEditingAIService implements CVProfileEditingAIService {
  async edit(input: {
    profile: StandardCVProfile;
    instruction: string;
  }): Promise<StandardCVProfile> {
    return {
      ...input.profile,
      summary: `[mock-ai] ${input.instruction} ${input.profile.summary ?? ""}`.trim(),
    };
  }
}

export class MockCVProfileEditingAIServiceFactory {
  create(): CVProfileEditingAIService {
    return new MockCVProfileEditingAIService();
  }
}
