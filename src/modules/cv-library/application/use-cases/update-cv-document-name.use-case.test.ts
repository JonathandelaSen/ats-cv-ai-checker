import { describe, expect, it } from "vitest";
import { documentRepo, tracker } from "./cv-library-test-helpers.test";
import { UpdateCVDocumentNameUseCase } from "./update-cv-document-name.use-case";

describe("UpdateCVDocumentNameUseCase", () => {
  it("renames an existing document", async () => {
    const repo = documentRepo();
    const result = await new UpdateCVDocumentNameUseCase({
      documentRepo: repo,
      tracker: tracker(),
    }).execute({ id: "cv-1", userId: "user-1", name: "Updated" });

    expect(result?.toPrimitives().name).toBe("Updated");
    expect(repo.save).toHaveBeenCalledOnce();
  });
});
