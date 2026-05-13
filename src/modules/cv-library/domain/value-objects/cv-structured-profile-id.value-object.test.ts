import { describe, expect, it } from "vitest";
import { CVStructuredProfileId } from "./cv-structured-profile-id.value-object";

describe("CVStructuredProfileId", () => {
  it("round-trips a non-empty id", () => {
    expect(CVStructuredProfileId.fromPrimitives("profile-1").toPrimitives()).toBe("profile-1");
  });

  it("rejects blank ids", () => {
    expect(() => CVStructuredProfileId.fromPrimitives(" ")).toThrow("CV structured profile id is required");
  });
});
