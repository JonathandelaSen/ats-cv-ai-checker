import { AggregateRoot, Timestamp, UserId, type UserId as UserIdType } from "@/modules/shared";
import { WorkJournalContextCreatedEvent } from "../events/work-journal-context-created.event";
import { WorkJournalContextUpdatedEvent } from "../events/work-journal-context-updated.event";
import { WorkJournalContextId } from "../value-objects/work-journal-context-id.value-object";
import { WorkJournalContextName } from "../value-objects/work-journal-context-name.value-object";
import { type ContextStatus, WorkJournalContextStatus } from "../value-objects/work-journal-context-status.value-object";
import { type ContextType, WorkJournalContextType } from "../value-objects/work-journal-context-type.value-object";
import { WorkJournalCreatedFromCv } from "../value-objects/work-journal-created-from-cv.value-object";
import { WorkJournalIsDefault } from "../value-objects/work-journal-is-default.value-object";
import { WorkJournalRoleOrLabel } from "../value-objects/work-journal-role-or-label.value-object";

export type { ContextStatus, ContextType };

export interface WorkJournalContextPrimitives {
  id: string;
  userId: string;
  type: ContextType;
  name: string;
  roleOrLabel: string | null;
  status: ContextStatus;
  isDefault: boolean;
  createdFromCv: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkJournalContextCreateParams {
  id: WorkJournalContextId;
  userId: UserIdType;
  type: WorkJournalContextType;
  name: WorkJournalContextName;
  roleOrLabel: WorkJournalRoleOrLabel;
  status: WorkJournalContextStatus;
  isDefault: WorkJournalIsDefault;
  createdFromCv: WorkJournalCreatedFromCv;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkJournalContextUpdateParams {
  name?: WorkJournalContextName;
  roleOrLabel?: WorkJournalRoleOrLabel;
  status?: WorkJournalContextStatus;
  isDefault?: WorkJournalIsDefault;
}

export class WorkJournalContext extends AggregateRoot {
  private constructor(
    private readonly contextId: WorkJournalContextId,
    private readonly ownerId: UserIdType,
    private contextType: WorkJournalContextType,
    private contextName: WorkJournalContextName,
    private contextRoleOrLabel: WorkJournalRoleOrLabel,
    private contextStatus: WorkJournalContextStatus,
    private contextIsDefault: WorkJournalIsDefault,
    private readonly contextCreatedFromCv: WorkJournalCreatedFromCv,
    private readonly contextCreatedAt: Timestamp,
    private contextUpdatedAt: Timestamp
  ) {
    super();
  }

  static create(params: WorkJournalContextCreateParams): WorkJournalContext {
    const context = new WorkJournalContext(
      params.id,
      params.userId,
      params.type,
      params.name,
      params.roleOrLabel,
      params.status,
      params.isDefault,
      params.createdFromCv,
      params.createdAt,
      params.updatedAt
    );
    context.recordDomainEvent(
      new WorkJournalContextCreatedEvent(params.id.toPrimitives())
    );
    return context;
  }

  static fromPrimitives(primitives: WorkJournalContextPrimitives): WorkJournalContext {
    return new WorkJournalContext(
      WorkJournalContextId.fromPrimitives(primitives.id),
      UserId.fromPrimitives(primitives.userId),
      WorkJournalContextType.fromPrimitives(primitives.type),
      WorkJournalContextName.fromPrimitives(primitives.name),
      WorkJournalRoleOrLabel.fromPrimitives(primitives.roleOrLabel),
      WorkJournalContextStatus.fromPrimitives(primitives.status),
      WorkJournalIsDefault.fromPrimitives(primitives.isDefault),
      WorkJournalCreatedFromCv.fromPrimitives(primitives.createdFromCv),
      Timestamp.fromPrimitives(primitives.createdAt),
      Timestamp.fromPrimitives(primitives.updatedAt)
    );
  }

  get id(): string {
    return this.contextId.toPrimitives();
  }

  get userId(): string {
    return this.ownerId.toPrimitives();
  }

  get type(): ContextType {
    return this.contextType.toPrimitives();
  }

  get name(): string {
    return this.contextName.toPrimitives();
  }

  get roleOrLabel(): string | null {
    return this.contextRoleOrLabel.toPrimitives();
  }

  get status(): ContextStatus {
    return this.contextStatus.toPrimitives();
  }

  get isDefault(): boolean {
    return this.contextIsDefault.toPrimitives();
  }

  get idValue(): WorkJournalContextId {
    return this.contextId;
  }

  isActive(): boolean {
    return this.contextStatus.isActive();
  }

  update(params: WorkJournalContextUpdateParams): void {
    const fields: string[] = [];
    if (params.name) {
      this.contextName = params.name;
      fields.push("name");
    }
    if (params.roleOrLabel) {
      this.contextRoleOrLabel = params.roleOrLabel;
      fields.push("roleOrLabel");
    }
    if (params.status) {
      this.contextStatus = params.status;
      fields.push("status");
    }
    if (params.isDefault) {
      this.contextIsDefault = params.isDefault;
      fields.push("isDefault");
    }
    if (fields.length > 0) {
      this.recordDomainEvent(new WorkJournalContextUpdatedEvent(this.id, fields));
    }
  }

  toPrimitives(): WorkJournalContextPrimitives {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      name: this.name,
      roleOrLabel: this.roleOrLabel,
      status: this.status,
      isDefault: this.isDefault,
      createdFromCv: this.contextCreatedFromCv.toPrimitives(),
      createdAt: this.contextCreatedAt.toPrimitives(),
      updatedAt: this.contextUpdatedAt.toPrimitives(),
    };
  }
}
