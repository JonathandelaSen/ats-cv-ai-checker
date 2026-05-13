import {
  AggregateRoot,
  Timestamp,
  UserId,
  type UserId as UserIdType,
} from "@/modules/shared";
import { AIModelName } from "../value-objects/ai-model-name.value-object";
import { CVDocumentId } from "../value-objects/cv-document-id.value-object";
import { CVStructuredProfileId } from "../value-objects/cv-structured-profile-id.value-object";
import { ProfileSchemaVersion } from "../value-objects/profile-schema-version.value-object";
import { SourceTextHash } from "../value-objects/source-text-hash.value-object";

export interface CVStructuredProfilePrimitives {
  id: string;
  userId: string;
  cvDocumentId: string;
  schemaVersion: string;
  sourceTextHash: string;
  aiModel: string;
  profile: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface CVStructuredProfileCreateParams {
  id: CVStructuredProfileId;
  userId: UserIdType;
  cvDocumentId: CVDocumentId;
  schemaVersion: ProfileSchemaVersion;
  sourceTextHash: SourceTextHash;
  aiModel: AIModelName;
  profile: unknown;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class CVStructuredProfile extends AggregateRoot {
  private constructor(
    private readonly profileId: CVStructuredProfileId,
    private readonly ownerId: UserIdType,
    private readonly documentId: CVDocumentId,
    private readonly profileSchemaVersion: ProfileSchemaVersion,
    private readonly profileSourceTextHash: SourceTextHash,
    private readonly profileAIModel: AIModelName,
    private readonly profileData: unknown,
    private readonly profileCreatedAt: Timestamp,
    private readonly profileUpdatedAt: Timestamp
  ) {
    super();
  }

  static create(params: CVStructuredProfileCreateParams): CVStructuredProfile {
    return new CVStructuredProfile(
      params.id,
      params.userId,
      params.cvDocumentId,
      params.schemaVersion,
      params.sourceTextHash,
      params.aiModel,
      params.profile,
      params.createdAt,
      params.updatedAt
    );
  }

  static fromPrimitives(
    primitives: CVStructuredProfilePrimitives
  ): CVStructuredProfile {
    return CVStructuredProfile.create({
      id: CVStructuredProfileId.fromPrimitives(primitives.id),
      userId: UserId.fromPrimitives(primitives.userId),
      cvDocumentId: CVDocumentId.fromPrimitives(primitives.cvDocumentId),
      schemaVersion: ProfileSchemaVersion.fromPrimitives(primitives.schemaVersion),
      sourceTextHash: SourceTextHash.fromPrimitives(primitives.sourceTextHash),
      aiModel: AIModelName.fromPrimitives(primitives.aiModel),
      profile: primitives.profile,
      createdAt: Timestamp.fromPrimitives(primitives.createdAt),
      updatedAt: Timestamp.fromPrimitives(primitives.updatedAt),
    });
  }

  get id(): string {
    return this.profileId.toPrimitives();
  }

  get userId(): string {
    return this.ownerId.toPrimitives();
  }

  get cvDocumentId(): string {
    return this.documentId.toPrimitives();
  }

  toPrimitives(): CVStructuredProfilePrimitives {
    return {
      id: this.id,
      userId: this.userId,
      cvDocumentId: this.cvDocumentId,
      schemaVersion: this.profileSchemaVersion.toPrimitives(),
      sourceTextHash: this.profileSourceTextHash.toPrimitives(),
      aiModel: this.profileAIModel.toPrimitives(),
      profile: this.profileData,
      createdAt: this.profileCreatedAt.toPrimitives(),
      updatedAt: this.profileUpdatedAt.toPrimitives(),
    };
  }
}
