import type { UserId } from "@/modules/shared";
import type { CVStructuredProfile } from "../entities/cv-structured-profile.entity";
import type { CVDocumentId } from "../value-objects/cv-document-id.value-object";
import type { ProfileSchemaVersion } from "../value-objects/profile-schema-version.value-object";

export interface CVStructuredProfileRepository {
  findByDocumentId(
    cvDocumentId: CVDocumentId,
    userId: UserId,
    schemaVersion: ProfileSchemaVersion
  ): Promise<CVStructuredProfile | null>;
  save(profile: CVStructuredProfile): Promise<CVStructuredProfile>;
}
