import { describe, expect, it } from "vitest";
import { Timestamp } from "./timestamp.value-object";

describe("Timestamp", () => {
  it("round-trips a timestamp string", () => {
    const value = "2026-05-11T10:00:00.000Z";
    expect(Timestamp.fromPrimitives(value).toPrimitives()).toBe(value);
  });

  it("rejects empty timestamps", () => {
    expect(() => Timestamp.fromPrimitives(" ")).toThrow("timestamp cannot be empty");
  });
});
