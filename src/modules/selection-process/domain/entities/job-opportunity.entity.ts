import {
  AggregateRoot,
  Timestamp,
  UserId,
  type UserId as UserIdType,
} from "@/modules/shared";
import { JobOpportunityId } from "../value-objects/job-opportunity-id.value-object";

export interface JobOpportunityPrimitives {
  id: string;
  userId: string;
  title: string | null;
  company: string | null;
  location: string | null;
  remote: string | null;
  salary: string | null;
  seniority: string | null;
  contractType: string | null;
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  notablePoints: string[];
  description: string | null;
  url: string | null;
  sourceJobMatchAnalysisId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobOpportunityCreateParams {
  id: JobOpportunityId;
  userId: UserIdType;
  title: string | null;
  company: string | null;
  location: string | null;
  remote: string | null;
  salary: string | null;
  seniority: string | null;
  contractType: string | null;
  benefits: string[];
  requirements: string[];
  responsibilities: string[];
  notablePoints: string[];
  description: string | null;
  url: string | null;
  sourceJobMatchAnalysisId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class JobOpportunity extends AggregateRoot {
  private constructor(
    private readonly opportunityId: JobOpportunityId,
    private readonly ownerId: UserIdType,
    private readonly opportunityTitle: string | null,
    private readonly opportunityCompany: string | null,
    private readonly opportunityLocation: string | null,
    private readonly opportunityRemote: string | null,
    private readonly opportunitySalary: string | null,
    private readonly opportunitySeniority: string | null,
    private readonly opportunityContractType: string | null,
    private readonly opportunityBenefits: string[],
    private readonly opportunityRequirements: string[],
    private readonly opportunityResponsibilities: string[],
    private readonly opportunityNotablePoints: string[],
    private readonly opportunityDescription: string | null,
    private readonly opportunityUrl: string | null,
    private readonly opportunitySourceJobMatchAnalysisId: string | null,
    private readonly opportunityCreatedAt: Timestamp,
    private readonly opportunityUpdatedAt: Timestamp
  ) {
    super();
  }

  static create(params: JobOpportunityCreateParams): JobOpportunity {
    return new JobOpportunity(
      params.id,
      params.userId,
      params.title,
      params.company,
      params.location,
      params.remote,
      params.salary,
      params.seniority,
      params.contractType,
      params.benefits,
      params.requirements,
      params.responsibilities,
      params.notablePoints,
      params.description,
      params.url,
      params.sourceJobMatchAnalysisId,
      params.createdAt,
      params.updatedAt
    );
  }

  static fromPrimitives(primitives: JobOpportunityPrimitives): JobOpportunity {
    return JobOpportunity.create({
      id: JobOpportunityId.fromPrimitives(primitives.id),
      userId: UserId.fromPrimitives(primitives.userId),
      title: primitives.title,
      company: primitives.company,
      location: primitives.location,
      remote: primitives.remote,
      salary: primitives.salary,
      seniority: primitives.seniority,
      contractType: primitives.contractType,
      benefits: primitives.benefits,
      requirements: primitives.requirements,
      responsibilities: primitives.responsibilities,
      notablePoints: primitives.notablePoints,
      description: primitives.description,
      url: primitives.url,
      sourceJobMatchAnalysisId: primitives.sourceJobMatchAnalysisId,
      createdAt: Timestamp.fromPrimitives(primitives.createdAt),
      updatedAt: Timestamp.fromPrimitives(primitives.updatedAt),
    });
  }

  get id(): string {
    return this.opportunityId.toPrimitives();
  }

  get userId(): string {
    return this.ownerId.toPrimitives();
  }

  toPrimitives(): JobOpportunityPrimitives {
    return {
      id: this.id,
      userId: this.userId,
      title: this.opportunityTitle,
      company: this.opportunityCompany,
      location: this.opportunityLocation,
      remote: this.opportunityRemote,
      salary: this.opportunitySalary,
      seniority: this.opportunitySeniority,
      contractType: this.opportunityContractType,
      benefits: this.opportunityBenefits,
      requirements: this.opportunityRequirements,
      responsibilities: this.opportunityResponsibilities,
      notablePoints: this.opportunityNotablePoints,
      description: this.opportunityDescription,
      url: this.opportunityUrl,
      sourceJobMatchAnalysisId: this.opportunitySourceJobMatchAnalysisId,
      createdAt: this.opportunityCreatedAt.toPrimitives(),
      updatedAt: this.opportunityUpdatedAt.toPrimitives(),
    };
  }
}
