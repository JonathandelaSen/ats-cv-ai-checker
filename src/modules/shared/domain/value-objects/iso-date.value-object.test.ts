import { describe, expect, it } from "vitest";
import { IsoDate } from "./iso-date.value-object";

describe("IsoDate", () => {
  it("round-trips yyyy-mm-dd dates", () => {
    expect(IsoDate.fromPrimitives("2026-05-11").toPrimitives()).toBe("2026-05-11");
  });

  it("rejects non ISO dates", () => {
    expect(() => IsoDate.fromPrimitives("11/05/2026")).toThrow("Invalid ISO date");
  });
});
