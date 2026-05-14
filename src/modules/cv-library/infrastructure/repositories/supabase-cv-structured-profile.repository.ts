import { normalizeStandardCVProfile } from "../../domain/cv-profile";
import { BoundSupabaseRepository, type UserId } from "@/modules/shared";
import { CVStructuredProfile } from "../../domain/entities/cv-structured-profile.entity";
import type { CVStructuredProfileRepository } from "../../domain/repositories/cv-structured-profile.repository";
import type { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";
import type { ProfileSchemaVersion } from "../../domain/value-objects/profile-schema-version.value-object";

interface CVStructuredProfileRow {
  id: string;
  user_id: string;
  cv_id: string;
  schema_version: string;
  source_text_hash: string;
  ai_model: string;
  profile: unknown;
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: CVStructuredProfileRow): CVStructuredProfile {
  return CVStructuredProfile.fromPrimitives({
    id: row.id,
    userId: row.user_id,
    cvDocumentId: row.cv_id,
    schemaVersion: row.schema_version,
    sourceTextHash: row.source_text_hash,
    aiModel: row.ai_model,
    profile: normalizeStandardCVProfile(row.profile),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function profileToRow(profile: CVStructuredProfile): CVStructuredProfileRow {
  const primitives = profile.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    cv_id: primitives.cvDocumentId,
    schema_version: primitives.schemaVersion,
    source_text_hash: primitives.sourceTextHash,
    ai_model: primitives.aiModel,
    profile: primitives.profile,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export class SupabaseCVStructuredProfileRepository
  extends BoundSupabaseRepository
  implements CVStructuredProfileRepository
{
  async findByDocumentId(
    cvDocumentId: CVDocumentId,
    userId: UserId,
    schemaVersion: ProfileSchemaVersion
  ): Promise<CVStructuredProfile | null> {
    const { data, error } = await this.client
      .from("cv_structured_profiles")
      .select("*")
      .eq("cv_id", cvDocumentId.toPrimitives())
      .eq("user_id", userId.toPrimitives())
      .eq("schema_version", schemaVersion.toPrimitives())
      .maybeSingle();

    if (error) throw error;
    return data ? rowToProfile(data as CVStructuredProfileRow) : null;
  }

  async save(profile: CVStructuredProfile): Promise<CVStructuredProfile> {
    const { data, error } = await this.client
      .from("cv_structured_profiles")
      .upsert(profileToRow(profile), { onConflict: "cv_id,schema_version" })
      .select("*")
      .single();

    if (error) throw error;
    return rowToProfile(data as CVStructuredProfileRow);
  }
}
