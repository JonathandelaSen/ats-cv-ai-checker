import { ValueObject } from "@/modules/shared";

export class JobOpportunityId extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Job opportunity id is required");
  }

  static fromPrimitives(value: string): JobOpportunityId {
    return new JobOpportunityId(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
