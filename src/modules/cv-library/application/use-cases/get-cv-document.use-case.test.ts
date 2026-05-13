import { describe, expect, it } from "vitest";
import { documentRepo } from "./cv-library-test-helpers.test";
import { GetCVDocumentUseCase } from "./get-cv-document.use-case";

describe("GetCVDocumentUseCase", () => {
  it("gets a document by id and user", async () => {
    const repo = documentRepo();
    const result = await new GetCVDocumentUseCase({ documentRepo: repo }).execute({
      id: "cv-1",
      userId: "user-1",
    });

    expect(result?.id).toBe("cv-1");
    expect(repo.findById).toHaveBeenCalledOnce();
  });
});
