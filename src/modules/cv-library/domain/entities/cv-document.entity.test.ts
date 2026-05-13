import { describe, expect, it } from "vitest";
import { Timestamp, UserId } from "@/modules/shared";
import { CVDocument } from "./cv-document.entity";
import { CVDocumentId } from "../value-objects/cv-document-id.value-object";
import { CVDocumentName } from "../value-objects/cv-document-name.value-object";
import { CVDocumentType } from "../value-objects/cv-document-type.value-object";

const now = "2026-05-13T10:00:00.000Z";

function createDocument(overrides: Partial<Parameters<typeof CVDocument.create>[0]> = {}) {
  return CVDocument.create({
    id: CVDocumentId.fromPrimitives("cv-1"),
    userId: UserId.fromPrimitives("user-1"),
    name: CVDocumentName.fromPrimitives("Original CV"),
    filename: "original.pdf",
    fileSize: 123,
    pdfStoragePath: "user-1/cv-1.pdf",
    type: CVDocumentType.fromPrimitives("uploaded"),
    sourceCvId: null,
    templateId: null,
    templateLocale: null,
    schemaVersion: null,
    sourceTextHash: null,
    aiModel: null,
    profile: null,
    extractedText: {
      textPython: "python text",
      textPdfjs: null,
      textNode: null,
      extractErrorPython: null,
      extractErrorPdfjs: null,
      extractErrorNode: null,
    },
    publicSettings: {
      enabled: false,
      publicId: null,
      slug: null,
      publishedAt: null,
    },
    createdAt: Timestamp.fromPrimitives(now),
    updatedAt: Timestamp.fromPrimitives(now),
    ...overrides,
  });
}

describe("CVDocument", () => {
  it("creates and serializes an uploaded document with camelCase primitives", () => {
    expect(createDocument().toPrimitives()).toMatchObject({
      id: "cv-1",
      userId: "user-1",
      name: "Original CV",
      filename: "original.pdf",
      type: "uploaded",
      extractedText: { textPython: "python text" },
      publicSettings: { enabled: false, publicId: null },
    });
  });

  it("hydrates from primitives and renames the document", () => {
    const document = CVDocument.fromPrimitives(createDocument().toPrimitives());
    document.rename(CVDocumentName.fromPrimitives("Updated CV"), Timestamp.fromPrimitives("2026-05-13T11:00:00.000Z"));

    expect(document.toPrimitives()).toMatchObject({
      name: "Updated CV",
      updatedAt: "2026-05-13T11:00:00.000Z",
    });
  });

  it("enables public settings with a published timestamp", () => {
    const document = createDocument({ type: CVDocumentType.fromPrimitives("template") });
    document.updatePublicSettings({
      enabled: true,
      publicId: "pub-1",
      slug: "senior-cv",
      publishedAt: Timestamp.fromPrimitives("2026-05-13T12:00:00.000Z"),
    });

    expect(document.toPrimitives().publicSettings).toEqual({
      enabled: true,
      publicId: "pub-1",
      slug: "senior-cv",
      publishedAt: "2026-05-13T12:00:00.000Z",
    });
  });
});
