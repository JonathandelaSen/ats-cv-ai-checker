import { describe, expect, it } from "vitest";
import { CVDocumentId } from "./cv-document-id.value-object";

describe("CVDocumentId", () => {
  it("round-trips a non-empty id", () => {
    expect(CVDocumentId.fromPrimitives("cv-1").toPrimitives()).toBe("cv-1");
  });

  it("rejects blank ids", () => {
    expect(() => CVDocumentId.fromPrimitives(" ")).toThrow("CV document id is required");
  });
});
