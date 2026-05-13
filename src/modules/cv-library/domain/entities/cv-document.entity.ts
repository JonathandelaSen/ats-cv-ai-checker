import {
  AggregateRoot,
  Timestamp,
  UserId,
  type UserId as UserIdType,
} from "@/modules/shared";
import {
  CVDocumentType,
  type CVDocumentTypePrimitives,
} from "../value-objects/cv-document-type.value-object";
import { CVDocumentId } from "../value-objects/cv-document-id.value-object";
import { CVDocumentName } from "../value-objects/cv-document-name.value-object";

export interface CVDocumentExtractedTextPrimitives {
  textPython: string | null;
  textPdfjs: string | null;
  textNode: string | null;
  extractErrorPython: string | null;
  extractErrorPdfjs: string | null;
  extractErrorNode: string | null;
}

export interface CVPublicSettingsPrimitives {
  enabled: boolean;
  publicId: string | null;
  slug: string | null;
  publishedAt: string | null;
}

export interface CVDocumentPrimitives {
  id: string;
  userId: string;
  name: string;
  filename: string | null;
  fileSize: number | null;
  pdfStoragePath: string | null;
  type: CVDocumentTypePrimitives;
  sourceCvId: string | null;
  templateId: string | null;
  templateLocale: string | null;
  schemaVersion: string | null;
  sourceTextHash: string | null;
  aiModel: string | null;
  profile: unknown | null;
  extractedText: CVDocumentExtractedTextPrimitives;
  publicSettings: CVPublicSettingsPrimitives;
  createdAt: string;
  updatedAt: string;
}

export interface CVDocumentCreateParams {
  id: CVDocumentId;
  userId: UserIdType;
  name: CVDocumentName;
  filename: string | null;
  fileSize: number | null;
  pdfStoragePath: string | null;
  type: CVDocumentType;
  sourceCvId: string | null;
  templateId: string | null;
  templateLocale: string | null;
  schemaVersion: string | null;
  sourceTextHash: string | null;
  aiModel: string | null;
  profile: unknown | null;
  extractedText: CVDocumentExtractedTextPrimitives;
  publicSettings: {
    enabled: boolean;
    publicId: string | null;
    slug: string | null;
    publishedAt: string | null;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class CVDocument extends AggregateRoot {
  private constructor(
    private readonly documentId: CVDocumentId,
    private readonly ownerId: UserIdType,
    private documentName: CVDocumentName,
    private readonly documentFilename: string | null,
    private readonly documentFileSize: number | null,
    private readonly documentPdfStoragePath: string | null,
    private readonly documentType: CVDocumentType,
    private readonly documentSourceCvId: string | null,
    private readonly documentTemplateId: string | null,
    private documentTemplateLocale: string | null,
    private readonly documentSchemaVersion: string | null,
    private readonly documentSourceTextHash: string | null,
    private documentAIModel: string | null,
    private documentProfile: unknown | null,
    private readonly documentExtractedText: CVDocumentExtractedTextPrimitives,
    private documentPublicSettings: CVPublicSettingsPrimitives,
    private readonly documentCreatedAt: Timestamp,
    private documentUpdatedAt: Timestamp
  ) {
    super();
  }

  static create(params: CVDocumentCreateParams): CVDocument {
    return new CVDocument(
      params.id,
      params.userId,
      params.name,
      params.filename,
      params.fileSize,
      params.pdfStoragePath,
      params.type,
      params.sourceCvId,
      params.templateId,
      params.templateLocale,
      params.schemaVersion,
      params.sourceTextHash,
      params.aiModel,
      params.profile,
      params.extractedText,
      params.publicSettings,
      params.createdAt,
      params.updatedAt
    );
  }

  static fromPrimitives(primitives: CVDocumentPrimitives): CVDocument {
    return CVDocument.create({
      id: CVDocumentId.fromPrimitives(primitives.id),
      userId: UserId.fromPrimitives(primitives.userId),
      name: CVDocumentName.fromPrimitives(primitives.name),
      filename: primitives.filename,
      fileSize: primitives.fileSize,
      pdfStoragePath: primitives.pdfStoragePath,
      type: CVDocumentType.fromPrimitives(primitives.type),
      sourceCvId: primitives.sourceCvId,
      templateId: primitives.templateId,
      templateLocale: primitives.templateLocale,
      schemaVersion: primitives.schemaVersion,
      sourceTextHash: primitives.sourceTextHash,
      aiModel: primitives.aiModel,
      profile: primitives.profile,
      extractedText: primitives.extractedText,
      publicSettings: primitives.publicSettings,
      createdAt: Timestamp.fromPrimitives(primitives.createdAt),
      updatedAt: Timestamp.fromPrimitives(primitives.updatedAt),
    });
  }

  get id(): string {
    return this.documentId.toPrimitives();
  }

  get userId(): string {
    return this.ownerId.toPrimitives();
  }

  get idValue(): CVDocumentId {
    return this.documentId;
  }

  get type(): CVDocumentTypePrimitives {
    return this.documentType.toPrimitives();
  }

  get pdfStoragePath(): string | null {
    return this.documentPdfStoragePath;
  }

  rename(name: CVDocumentName, updatedAt: Timestamp): void {
    this.documentName = name;
    this.documentUpdatedAt = updatedAt;
  }

  updateTemplateProfile(input: {
    name?: CVDocumentName;
    profile?: unknown;
    aiModel?: string;
    templateLocale?: string;
    updatedAt: Timestamp;
  }): void {
    if (input.name) this.documentName = input.name;
    if (input.profile !== undefined) this.documentProfile = input.profile;
    if (input.aiModel !== undefined) this.documentAIModel = input.aiModel;
    if (input.templateLocale !== undefined) {
      this.documentTemplateLocale = input.templateLocale;
    }
    this.documentUpdatedAt = input.updatedAt;
  }

  updatePublicSettings(settings: {
    enabled: boolean;
    publicId: string | null;
    slug: string | null;
    publishedAt: Timestamp | null;
  }): void {
    this.documentPublicSettings = {
      enabled: settings.enabled,
      publicId: settings.publicId,
      slug: settings.slug,
      publishedAt: settings.publishedAt?.toPrimitives() ?? null,
    };
  }

  toPrimitives(): CVDocumentPrimitives {
    return {
      id: this.id,
      userId: this.userId,
      name: this.documentName.toPrimitives(),
      filename: this.documentFilename,
      fileSize: this.documentFileSize,
      pdfStoragePath: this.documentPdfStoragePath,
      type: this.documentType.toPrimitives(),
      sourceCvId: this.documentSourceCvId,
      templateId: this.documentTemplateId,
      templateLocale: this.documentTemplateLocale,
      schemaVersion: this.documentSchemaVersion,
      sourceTextHash: this.documentSourceTextHash,
      aiModel: this.documentAIModel,
      profile: this.documentProfile,
      extractedText: this.documentExtractedText,
      publicSettings: this.documentPublicSettings,
      createdAt: this.documentCreatedAt.toPrimitives(),
      updatedAt: this.documentUpdatedAt.toPrimitives(),
    };
  }
}
