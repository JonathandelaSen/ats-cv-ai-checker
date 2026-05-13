import { describe, expect, it } from "vitest";
import { JobOpportunityId } from "./job-opportunity-id.value-object";

describe("JobOpportunityId", () => {
  it("round-trips non-empty ids", () => {
    expect(JobOpportunityId.fromPrimitives("job-1").toPrimitives()).toBe("job-1");
  });

  it("rejects blank ids", () => {
    expect(() => JobOpportunityId.fromPrimitives(" ")).toThrow("Job opportunity id is required");
  });
});
