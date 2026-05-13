import { describe, expect, it } from "vitest";
import { ProfileSchemaVersion } from "./profile-schema-version.value-object";

describe("ProfileSchemaVersion", () => {
  it("round-trips a schema version", () => {
    expect(ProfileSchemaVersion.fromPrimitives("standard-v1").toPrimitives()).toBe("standard-v1");
  });

  it("rejects blank versions", () => {
    expect(() => ProfileSchemaVersion.fromPrimitives(" ")).toThrow("Profile schema version is required");
  });
});
