import { describe, expect, it, vi } from "vitest";
import { FollowUp } from "../../domain/entities/follow-up.entity";
import type { FollowUpRepository } from "../../domain/repositories/follow-up.repository";
import { UpdateFollowUpByAnalysisUseCase } from "./update-follow-up-by-analysis.use-case";
import { tracker } from "./selection-process-test-helpers.test";

function followUp() {
  return FollowUp.fromPrimitives({
    id: "follow-1",
    userId: "user-1",
    jobOpportunityId: "job-1",
    status: "interesante",
    notes: null,
    nextAction: null,
    nextActionAt: null,
    sourceJobMatchAnalysisId: "analysis-1",
    createdAt: "2026-05-13T10:00:00.000Z",
    updatedAt: "2026-05-13T10:00:00.000Z",
  });
}

describe("UpdateFollowUpByAnalysisUseCase", () => {
  it("updates follow-up tracking by source analysis", async () => {
    const repo: FollowUpRepository = {
      findBySourceJobMatchAnalysisId: vi.fn(async () => followUp()),
      save: vi.fn(async (item) => item),
    };

    const result = await new UpdateFollowUpByAnalysisUseCase({
      followUpRepo: repo,
      tracker: tracker(),
    }).execute({
      analysisId: "analysis-1",
      userId: "user-1",
      status: "aplicado",
      notes: "Sent",
      nextAction: "Follow up",
      nextActionAt: "2026-05-20T10:00:00.000Z",
    });

    expect(result?.toPrimitives()).toMatchObject({
      status: "aplicado",
      notes: "Sent",
      nextAction: "Follow up",
    });
    expect(repo.save).toHaveBeenCalledOnce();
  });
});
