import { describe, expect, it } from "vitest";
import { OptionalIsoDate } from "./optional-iso-date.value-object";

describe("OptionalIsoDate", () => {
  it("accepts null and yyyy-mm-dd dates", () => {
    expect(OptionalIsoDate.fromPrimitives(null).toPrimitives()).toBeNull();
    expect(OptionalIsoDate.fromPrimitives("2026-05-11").toPrimitives()).toBe("2026-05-11");
  });

  it("rejects invalid non-null dates", () => {
    expect(() => OptionalIsoDate.fromPrimitives("2026/05/11")).toThrow(
      "Invalid optional ISO date"
    );
  });
});
