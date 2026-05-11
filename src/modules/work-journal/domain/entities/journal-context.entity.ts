import { AggregateRoot, UserId, type UserId as UserIdType } from "@/modules/shared";
import { WorkJournalContextCreatedEvent } from "../events/work-journal-context-created.event";
import { WorkJournalContextUpdatedEvent } from "../events/work-journal-context-updated.event";
import {
  type ContextStatus,
  type ContextType,
  WorkJournalContextId,
  WorkJournalContextName,
  WorkJournalContextStatus,
  WorkJournalContextType,
  WorkJournalCreatedFromCv,
  WorkJournalIsDefault,
  WorkJournalRoleOrLabel,
  WorkJournalTimestamp,
} from "../value-objects/work-journal.value-object";

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
  createdAt: WorkJournalTimestamp;
  updatedAt: WorkJournalTimestamp;
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
    private readonly contextCreatedAt: WorkJournalTimestamp,
    private contextUpdatedAt: WorkJournalTimestamp
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
      WorkJournalTimestamp.fromPrimitives(primitives.createdAt),
      WorkJournalTimestamp.fromPrimitives(primitives.updatedAt)
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
