import { describe, expect, it } from "vitest";
import { StructureCVProfileWithAIUseCase } from "./structure-cv-profile-with-ai.use-case";
import type {
  CVProfileStructuringAIService,
  CVProfileStructuringAIServiceFactory,
} from "../../domain/repositories/cv-profile-ai.service";

describe("StructureCVProfileWithAIUseCase", () => {
  it("creates a configured AI service and structures the provided text", async () => {
    const calls: unknown[] = [];
    const factory: CVProfileStructuringAIServiceFactory = {
      create(config): CVProfileStructuringAIService {
        calls.push(config);
        return {
          async structure(input) {
            calls.push(input);
            return {
              schemaVersion: "cv-profile.v1",
              profile: { basics: { name: "Ada" } },
            };
          },
        };
      },
    };

    const result = await new StructureCVProfileWithAIUseCase({
      aiFactory: factory,
    }).execute({
      apiKey: "key",
      model: "gemini-test",
      text: "Ada Lovelace",
    });

    expect(calls).toEqual([
      { apiKey: "key", model: "gemini-test" },
      { text: "Ada Lovelace" },
    ]);
    expect(result.profile.basics?.name).toBe("Ada");
  });
});
