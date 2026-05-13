import { describe, expect, it } from "vitest";
import { document, documentRepo, tracker } from "./cv-library-test-helpers.test";
import { UpdateCVDocumentPublicSettingsUseCase } from "./update-cv-document-public-settings.use-case";

describe("UpdateCVDocumentPublicSettingsUseCase", () => {
  it("updates public settings for template documents", async () => {
    const repo = documentRepo({ findById: async () => document({ type: "template" }) });
    const result = await new UpdateCVDocumentPublicSettingsUseCase({
      documentRepo: repo,
      tracker: tracker(),
    }).execute({
      id: "cv-1",
      userId: "user-1",
      publicEnabled: true,
      publicId: "pub-1",
      publicSlug: "ada-cv",
    });

    expect(result?.toPrimitives().publicSettings).toMatchObject({
      enabled: true,
      publicId: "pub-1",
      slug: "ada-cv",
    });
  });
});
