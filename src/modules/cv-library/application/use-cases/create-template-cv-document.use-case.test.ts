import { describe, expect, it } from "vitest";
import { documentRepo, tracker } from "./cv-library-test-helpers.test";
import { CreateTemplateCVDocumentUseCase } from "./create-template-cv-document.use-case";

describe("CreateTemplateCVDocumentUseCase", () => {
  it("creates a template document from profile data", async () => {
    const repo = documentRepo();
    const result = await new CreateTemplateCVDocumentUseCase({
      documentRepo: repo,
      tracker: tracker(),
    }).execute({
      userId: "user-1",
      sourceCvId: "cv-source",
      name: "Template CV",
      templateId: "classic",
      templateLocale: "es",
      schemaVersion: "standard-v1",
      sourceTextHash: "hash",
      aiModel: "gemini",
      profile: { basics: { name: "Ada" } },
      requestId: "req-1",
    });

    expect(result.toPrimitives()).toMatchObject({
      type: "template",
      sourceCvId: "cv-source",
      templateId: "classic",
    });
  });
});
