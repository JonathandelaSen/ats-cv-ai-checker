import { describe, expect, it } from "vitest";
import { SourceTextHash } from "./source-text-hash.value-object";

describe("SourceTextHash", () => {
  it("round-trips a hash", () => {
    expect(SourceTextHash.fromPrimitives("hash-1").toPrimitives()).toBe("hash-1");
  });

  it("allows an empty hash for legacy template copies", () => {
    expect(SourceTextHash.fromPrimitives("").toPrimitives()).toBe("");
  });
});
