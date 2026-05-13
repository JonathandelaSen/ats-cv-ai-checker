import {
  AggregateRoot,
  Timestamp,
  UserId,
  type UserId as UserIdType,
} from "@/modules/shared";
import { FollowUpId } from "../value-objects/follow-up-id.value-object";
import {
  FollowUpStatus,
  type FollowUpStatusPrimitives,
} from "../value-objects/follow-up-status.value-object";
import { JobOpportunityId } from "../value-objects/job-opportunity-id.value-object";

export interface FollowUpPrimitives {
  id: string;
  userId: string;
  jobOpportunityId: string;
  status: FollowUpStatusPrimitives;
  notes: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  sourceJobMatchAnalysisId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpCreateParams {
  id: FollowUpId;
  userId: UserIdType;
  jobOpportunityId: JobOpportunityId;
  status: FollowUpStatus;
  notes: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  sourceJobMatchAnalysisId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class FollowUp extends AggregateRoot {
  private constructor(
    private readonly followUpId: FollowUpId,
    private readonly ownerId: UserIdType,
    private readonly opportunityId: JobOpportunityId,
    private followUpStatus: FollowUpStatus,
    private followUpNotes: string | null,
    private followUpNextAction: string | null,
    private followUpNextActionAt: string | null,
    private readonly followUpSourceJobMatchAnalysisId: string | null,
    private readonly followUpCreatedAt: Timestamp,
    private followUpUpdatedAt: Timestamp
  ) {
    super();
  }

  static create(params: FollowUpCreateParams): FollowUp {
    return new FollowUp(
      params.id,
      params.userId,
      params.jobOpportunityId,
      params.status,
      params.notes,
      params.nextAction,
      params.nextActionAt,
      params.sourceJobMatchAnalysisId,
      params.createdAt,
      params.updatedAt
    );
  }

  static fromPrimitives(primitives: FollowUpPrimitives): FollowUp {
    return FollowUp.create({
      id: FollowUpId.fromPrimitives(primitives.id),
      userId: UserId.fromPrimitives(primitives.userId),
      jobOpportunityId: JobOpportunityId.fromPrimitives(primitives.jobOpportunityId),
      status: FollowUpStatus.fromPrimitives(primitives.status),
      notes: primitives.notes,
      nextAction: primitives.nextAction,
      nextActionAt: primitives.nextActionAt,
      sourceJobMatchAnalysisId: primitives.sourceJobMatchAnalysisId,
      createdAt: Timestamp.fromPrimitives(primitives.createdAt),
      updatedAt: Timestamp.fromPrimitives(primitives.updatedAt),
    });
  }

  update(input: {
    status: FollowUpStatus;
    notes: string | null;
    nextAction: string | null;
    nextActionAt: string | null;
    updatedAt: Timestamp;
  }): void {
    this.followUpStatus = input.status;
    this.followUpNotes = input.notes;
    this.followUpNextAction = input.nextAction;
    this.followUpNextActionAt = input.nextActionAt;
    this.followUpUpdatedAt = input.updatedAt;
  }

  get id(): string {
    return this.followUpId.toPrimitives();
  }

  toPrimitives(): FollowUpPrimitives {
    return {
      id: this.id,
      userId: this.ownerId.toPrimitives(),
      jobOpportunityId: this.opportunityId.toPrimitives(),
      status: this.followUpStatus.toPrimitives(),
      notes: this.followUpNotes,
      nextAction: this.followUpNextAction,
      nextActionAt: this.followUpNextActionAt,
      sourceJobMatchAnalysisId: this.followUpSourceJobMatchAnalysisId,
      createdAt: this.followUpCreatedAt.toPrimitives(),
      updatedAt: this.followUpUpdatedAt.toPrimitives(),
    };
  }
}
