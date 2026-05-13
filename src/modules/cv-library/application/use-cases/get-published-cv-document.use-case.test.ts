import { describe, expect, it } from "vitest";
import { documentRepo } from "./cv-library-test-helpers.test";
import { GetPublishedCVDocumentUseCase } from "./get-published-cv-document.use-case";

describe("GetPublishedCVDocumentUseCase", () => {
  it("gets a published document by public id", async () => {
    const repo = documentRepo();
    const result = await new GetPublishedCVDocumentUseCase({ documentRepo: repo }).execute({
      publicId: "pub-1",
    });

    expect(result?.id).toBe("cv-1");
    expect(repo.findPublishedByPublicId).toHaveBeenCalledOnce();
  });
});
