import { describe, expect, it, vi } from "vitest";
import type { EventTracker } from "@/modules/shared";
import { CVDocument } from "../../domain/entities/cv-document.entity";
import { CVStructuredProfile } from "../../domain/entities/cv-structured-profile.entity";
import type { CVDocumentRepository } from "../../domain/repositories/cv-document.repository";
import type { CVStructuredProfileRepository } from "../../domain/repositories/cv-structured-profile.repository";

export const now = "2026-05-13T10:00:00.000Z";

export function documentPrimitives(overrides: Partial<ReturnType<CVDocument["toPrimitives"]>> = {}) {
  return {
    id: "cv-1",
    userId: "user-1",
    name: "Original CV",
    filename: "original.pdf",
    fileSize: 123,
    pdfStoragePath: "user-1/cv-1.pdf",
    type: "uploaded" as const,
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
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function document(overrides: Partial<ReturnType<CVDocument["toPrimitives"]>> = {}) {
  return CVDocument.fromPrimitives(documentPrimitives(overrides));
}

export function profile(overrides: Partial<ReturnType<CVStructuredProfile["toPrimitives"]>> = {}) {
  return CVStructuredProfile.fromPrimitives({
    id: "profile-1",
    userId: "user-1",
    cvDocumentId: "cv-1",
    schemaVersion: "standard-v1",
    sourceTextHash: "hash-1",
    aiModel: "gemini",
    profile: { basics: { name: "Ada" } },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

export function documentRepo(overrides: Partial<CVDocumentRepository> = {}) {
  return {
    search: vi.fn(async () => [document()]),
    findById: vi.fn(async () => document()),
    findPublishedByPublicId: vi.fn(async () => document()),
    save: vi.fn(async (cv: CVDocument) => cv),
    delete: vi.fn(async () => undefined),
    deleteStoredPdf: vi.fn(async () => undefined),
    listAnalysisUsage: vi.fn(async () => []),
    ...overrides,
  } satisfies CVDocumentRepository;
}

export function structuredProfileRepo(
  overrides: Partial<CVStructuredProfileRepository> = {}
) {
  return {
    findByDocumentId: vi.fn(async () => profile()),
    save: vi.fn(async (structured: CVStructuredProfile) => structured),
    ...overrides,
  } satisfies CVStructuredProfileRepository;
}

export function tracker() {
  return { record: vi.fn(async () => undefined) } satisfies EventTracker;
}

describe("cv-library test helpers", () => {
  it("creates a reusable document fixture", () => {
    expect(document().id).toBe("cv-1");
  });
});
