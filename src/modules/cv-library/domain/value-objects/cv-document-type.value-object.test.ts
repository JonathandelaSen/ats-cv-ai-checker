import { describe, expect, it } from "vitest";
import { CVDocumentType } from "./cv-document-type.value-object";

describe("CVDocumentType", () => {
  it("accepts uploaded and template document types", () => {
    expect(CVDocumentType.fromPrimitives("uploaded").toPrimitives()).toBe("uploaded");
    expect(CVDocumentType.fromPrimitives("template").toPrimitives()).toBe("template");
  });

  it("rejects unknown document types", () => {
    expect(() => CVDocumentType.fromPrimitives("other")).toThrow("Invalid CV document type");
  });
});
