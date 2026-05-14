import { UserId } from "@/modules/shared";
import { CV_PROFILE_SCHEMA_VERSION } from "../../domain/cv-profile";
import type { CVStructuredProfile } from "../../domain/entities/cv-structured-profile.entity";
import type { CVStructuredProfileRepository } from "../../domain/repositories/cv-structured-profile.repository";
import { CVDocumentId } from "../../domain/value-objects/cv-document-id.value-object";
import { ProfileSchemaVersion } from "../../domain/value-objects/profile-schema-version.value-object";

export interface GetCVStructuredProfileInput {
  cvDocumentId: string;
  userId: string;
  schemaVersion?: string;
}

export class GetCVStructuredProfileUseCase {
  constructor(
    private readonly deps: { profileRepo: CVStructuredProfileRepository }
  ) {}

  async execute(
    input: GetCVStructuredProfileInput
  ): Promise<CVStructuredProfile | null> {
    return this.deps.profileRepo.findByDocumentId(
      CVDocumentId.fromPrimitives(input.cvDocumentId),
      UserId.fromPrimitives(input.userId),
      ProfileSchemaVersion.fromPrimitives(
        input.schemaVersion ?? CV_PROFILE_SCHEMA_VERSION
      )
    );
  }
}
