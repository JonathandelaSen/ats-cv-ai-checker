import { describe, expect, it } from "vitest";
import { createTestCV } from "@/modules/test-helpers/cv-fixtures";
import {
  createTestUser,
  getSupabaseClient,
  testLabel,
} from "@/modules/test-helpers/setup";
import { UserId } from "@/modules/shared";
import { CVStructuredProfile } from "../../domain/entities/cv-structured-profile.entity";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";
import { ProfileSchemaVersion } from "../../domain/value-objects/profile-schema-version.value-object";
import { SupabaseCVStructuredProfileRepository } from "./supabase-cv-structured-profile.repository";

const supabase = getSupabaseClient();
const repo = new SupabaseCVStructuredProfileRepository();
repo.bindRequest(supabase);

describe("SupabaseCVStructuredProfileRepository", () => {
  it("saves and finds structured profiles by document and schema version", async () => {
    const user = await createTestUser("cv-library-profile");
    const cv = await createTestCV(supabase, {
      id: crypto.randomUUID(),
      user_id: user.id,
      name: testLabel("cv"),
      filename: "cv.pdf",
      file_size: 100,
      pdf_storage_path: null,
    });

    const saved = await repo.save(
      CVStructuredProfile.fromPrimitives({
        id: crypto.randomUUID(),
        userId: user.id,
        cvDocumentId: cv.id,
        schemaVersion: "standard-v1",
        sourceTextHash: "hash-1",
        aiModel: "gemini",
        profile: { basics: { name: "Ada" } },
        createdAt: "2026-05-13T10:00:00.000Z",
        updatedAt: "2026-05-13T10:00:00.000Z",
      }),
    );

    const found = await repo.findByDocumentId(
      CVDocumentId.fromPrimitives(cv.id),
      UserId.fromPrimitives(user.id),
      ProfileSchemaVersion.fromPrimitives("standard-v1"),
    );

    expect(found?.id).toBe(saved.id);
    expect(found?.toPrimitives().profile).toMatchObject({
      basics: { name: "Ada" },
    });
  });
});
