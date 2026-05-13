import { describe, expect, it } from "vitest";
import { structuredProfileRepo } from "./cv-library-test-helpers.test";
import { GetCVStructuredProfileUseCase } from "./get-cv-structured-profile.use-case";

describe("GetCVStructuredProfileUseCase", () => {
  it("gets a profile by document id", async () => {
    const repo = structuredProfileRepo();
    const result = await new GetCVStructuredProfileUseCase({
      profileRepo: repo,
    }).execute({ cvDocumentId: "cv-1", userId: "user-1" });

    expect(result?.id).toBe("profile-1");
    expect(repo.findByDocumentId).toHaveBeenCalledOnce();
  });
});
