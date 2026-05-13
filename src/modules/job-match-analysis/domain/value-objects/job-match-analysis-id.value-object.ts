import { ValueObject } from "@/modules/shared";

export class JobMatchAnalysisId extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Job match analysis id is required");
  }

  static fromPrimitives(value: string): JobMatchAnalysisId {
    return new JobMatchAnalysisId(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
