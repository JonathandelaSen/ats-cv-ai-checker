import { describe, expect, it } from "vitest";
import { structuredProfileRepo, tracker } from "./cv-library-test-helpers.test";
import { UpsertCVStructuredProfileUseCase } from "./upsert-cv-structured-profile.use-case";

describe("UpsertCVStructuredProfileUseCase", () => {
  it("upserts profile data and records observability", async () => {
    const repo = structuredProfileRepo();
    const events = tracker();
    const result = await new UpsertCVStructuredProfileUseCase({
      profileRepo: repo,
      tracker: events,
    }).execute({
      userId: "user-1",
      cvDocumentId: "cv-1",
      schemaVersion: "standard-v1",
      sourceTextHash: "hash-1",
      aiModel: "gemini",
      profile: { basics: { name: "Ada" } },
      requestId: "req-1",
    });

    expect(result.toPrimitives()).toMatchObject({ cvDocumentId: "cv-1" });
    expect(repo.save).toHaveBeenCalledOnce();
    expect(events.record).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "cv_library_structured_profile_upserted" })
    );
  });
});
