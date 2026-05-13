import { describe, expect, it } from "vitest";
import { CVDocumentName } from "./cv-document-name.value-object";

describe("CVDocumentName", () => {
  it("trims and returns the document name", () => {
    expect(CVDocumentName.fromPrimitives("  Senior CV  ").toPrimitives()).toBe("Senior CV");
  });

  it("rejects empty names", () => {
    expect(() => CVDocumentName.fromPrimitives("")).toThrow("CV document name is required");
  });
});
