import { describe, expect, it } from "vitest";
import { documentRepo } from "./cv-library-test-helpers.test";
import { ListCVDocumentsUseCase } from "./list-cv-documents.use-case";

describe("ListCVDocumentsUseCase", () => {
  it("lists documents for a user", async () => {
    const repo = documentRepo();
    const result = await new ListCVDocumentsUseCase({ documentRepo: repo }).execute({
      userId: "user-1",
    });

    expect(result).toHaveLength(1);
    expect(repo.search).toHaveBeenCalledOnce();
  });
});
