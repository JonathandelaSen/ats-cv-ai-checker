import { describe, expect, it } from "vitest";
import { EditCVProfileWithAIUseCase } from "./edit-cv-profile-with-ai.use-case";
import type {
  CVProfileEditingAIService,
  CVProfileEditingAIServiceFactory,
} from "../../domain/repositories/cv-profile-ai.service";
import type { StandardCVProfile } from "../../domain/cv-profile";

describe("EditCVProfileWithAIUseCase", () => {
  it("creates a configured AI service and forwards the editing input", async () => {
    const calls: unknown[] = [];
    const original: StandardCVProfile = {
      basics: { name: "Ada" },
      presentation: { accentColor: "#111111" },
    };
    const factory: CVProfileEditingAIServiceFactory = {
      create(config): CVProfileEditingAIService {
        calls.push(config);
        return {
          async edit(input) {
            calls.push(input);
            return {
              ...input.profile,
              summary: "Edited",
            };
          },
        };
      },
    };

    const result = await new EditCVProfileWithAIUseCase({
      aiFactory: factory,
    }).execute({
      apiKey: "key",
      model: "gemini-test",
      profile: original,
      instruction: "Make it concise",
      templateId: "compact",
      locale: "es",
      recommendations: ["Add truthful TypeScript impact"],
    });

    expect(calls).toEqual([
      { apiKey: "key", model: "gemini-test" },
      {
        profile: original,
        instruction: "Make it concise",
        templateId: "compact",
        locale: "es",
        recommendations: ["Add truthful TypeScript impact"],
      },
    ]);
    expect(result.summary).toBe("Edited");
  });
});
