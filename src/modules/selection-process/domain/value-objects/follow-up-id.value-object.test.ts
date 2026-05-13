import { describe, expect, it } from "vitest";
import { FollowUpId } from "./follow-up-id.value-object";

describe("FollowUpId", () => {
  it("round-trips non-empty ids", () => {
    expect(FollowUpId.fromPrimitives("follow-1").toPrimitives()).toBe("follow-1");
  });
});
