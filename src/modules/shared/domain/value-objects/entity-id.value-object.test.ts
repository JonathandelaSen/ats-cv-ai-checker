import { describe, expect, it } from "vitest";
import { EntityId } from "./entity-id.value-object";

describe("EntityId", () => {
  it("round-trips a valid id", () => {
    expect(EntityId.fromPrimitives("id-1").toPrimitives()).toBe("id-1");
  });

  it("rejects empty ids", () => {
    expect(() => EntityId.fromPrimitives(" ")).toThrow("Entity id cannot be empty");
  });
});
