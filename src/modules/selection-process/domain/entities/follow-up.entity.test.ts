import { describe, expect, it } from "vitest";
import { Timestamp, UserId } from "@/modules/shared";
import { FollowUp } from "./follow-up.entity";
import { FollowUpId } from "../value-objects/follow-up-id.value-object";
import { FollowUpStatus } from "../value-objects/follow-up-status.value-object";
import { JobOpportunityId } from "../value-objects/job-opportunity-id.value-object";

const now = "2026-05-13T10:00:00.000Z";

describe("FollowUp", () => {
  it("updates tracking fields", () => {
    const followUp = FollowUp.create({
      id: FollowUpId.fromPrimitives("follow-1"),
      userId: UserId.fromPrimitives("user-1"),
      jobOpportunityId: JobOpportunityId.fromPrimitives("job-1"),
      status: FollowUpStatus.fromPrimitives("interesante"),
      notes: null,
      nextAction: null,
      nextActionAt: null,
      sourceJobMatchAnalysisId: "analysis-1",
      createdAt: Timestamp.fromPrimitives(now),
      updatedAt: Timestamp.fromPrimitives(now),
    });

    followUp.update({
      status: FollowUpStatus.fromPrimitives("aplicado"),
      notes: "Sent CV",
      nextAction: "Follow up",
      nextActionAt: "2026-05-20T10:00:00.000Z",
      updatedAt: Timestamp.fromPrimitives("2026-05-13T11:00:00.000Z"),
    });

    expect(followUp.toPrimitives()).toMatchObject({
      status: "aplicado",
      notes: "Sent CV",
      nextAction: "Follow up",
    });
  });
});
