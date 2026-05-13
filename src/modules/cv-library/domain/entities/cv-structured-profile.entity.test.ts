import { describe, expect, it } from "vitest";
import { Timestamp, UserId } from "@/modules/shared";
import { CVStructuredProfile } from "./cv-structured-profile.entity";
import { CVDocumentId } from "../value-objects/cv-document-id.value-object";
import { CVStructuredProfileId } from "../value-objects/cv-structured-profile-id.value-object";
import { ProfileSchemaVersion } from "../value-objects/profile-schema-version.value-object";
import { SourceTextHash } from "../value-objects/source-text-hash.value-object";
import { AIModelName } from "../value-objects/ai-model-name.value-object";

const profile = { basics: { name: "Ada" }, experience: [] };

describe("CVStructuredProfile", () => {
  it("creates and serializes a structured profile", () => {
    const structured = CVStructuredProfile.create({
      id: CVStructuredProfileId.fromPrimitives("profile-1"),
      userId: UserId.fromPrimitives("user-1"),
      cvDocumentId: CVDocumentId.fromPrimitives("cv-1"),
      schemaVersion: ProfileSchemaVersion.fromPrimitives("standard-v1"),
      sourceTextHash: SourceTextHash.fromPrimitives("hash-1"),
      aiModel: AIModelName.fromPrimitives("gemini"),
      profile,
      createdAt: Timestamp.fromPrimitives("2026-05-13T10:00:00.000Z"),
      updatedAt: Timestamp.fromPrimitives("2026-05-13T10:00:00.000Z"),
    });

    expect(structured.toPrimitives()).toMatchObject({
      id: "profile-1",
      userId: "user-1",
      cvDocumentId: "cv-1",
      schemaVersion: "standard-v1",
      sourceTextHash: "hash-1",
      aiModel: "gemini",
      profile,
    });
  });

  it("hydrates from primitives", () => {
    const structured = CVStructuredProfile.fromPrimitives({
      id: "profile-1",
      userId: "user-1",
      cvDocumentId: "cv-1",
      schemaVersion: "standard-v1",
      sourceTextHash: "hash-1",
      aiModel: "gemini",
      profile,
      createdAt: "2026-05-13T10:00:00.000Z",
      updatedAt: "2026-05-13T10:00:00.000Z",
    });

    expect(structured.id).toBe("profile-1");
    expect(structured.cvDocumentId).toBe("cv-1");
  });
});
