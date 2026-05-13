import { describe, expect, it } from "vitest";
import { document, documentRepo, tracker } from "./cv-library-test-helpers.test";
import { UpdateTemplateCVDocumentProfileUseCase } from "./update-template-cv-document-profile.use-case";

describe("UpdateTemplateCVDocumentProfileUseCase", () => {
  it("updates profile data only for template documents", async () => {
    const repo = documentRepo({ findById: async () => document({ type: "template" }) });
    const result = await new UpdateTemplateCVDocumentProfileUseCase({
      documentRepo: repo,
      tracker: tracker(),
    }).execute({
      id: "cv-1",
      userId: "user-1",
      name: "Template",
      profile: { basics: { name: "Ada" } },
      templateLocale: "en",
    });

    expect(result?.toPrimitives()).toMatchObject({
      name: "Template",
      profile: { basics: { name: "Ada" } },
      templateLocale: "en",
    });
  });
});
