import {
  CV_PROFILE_SCHEMA_VERSION,
  normalizeStandardCVProfile,
} from "../../domain/cv-profile";
import type {
  CVProfileStructuringAIService,
  StructuredCVProfileResult,
} from "../../domain/repositories/cv-profile-ai.service";

class MockCVProfileStructuringAIService
  implements CVProfileStructuringAIService
{
  async structure(input: { text: string }): Promise<StructuredCVProfileResult> {
    return {
      schemaVersion: CV_PROFILE_SCHEMA_VERSION,
      profile: normalizeStandardCVProfile({
        summary: `[mock-ai] Perfil estructurado desde ${input.text.length} caracteres.`,
        basics: { name: "[mock-ai] Candidate" },
        experience: [],
        education: [],
        skills: ["[mock-ai] structured-profile"],
      }),
    };
  }
}

export class MockCVProfileStructuringAIServiceFactory {
  create(): CVProfileStructuringAIService {
    return new MockCVProfileStructuringAIService();
  }
}
