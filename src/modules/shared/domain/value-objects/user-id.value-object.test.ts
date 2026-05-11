import { describe, expect, it } from "vitest";
import { UserId } from "./user-id.value-object";

describe("UserId", () => {
  it("round-trips a valid user id", () => {
    expect(UserId.fromPrimitives("user-1").toPrimitives()).toBe("user-1");
  });

  it("rejects empty user ids", () => {
    expect(() => UserId.fromPrimitives(" ")).toThrow("User id cannot be empty");
  });
});
