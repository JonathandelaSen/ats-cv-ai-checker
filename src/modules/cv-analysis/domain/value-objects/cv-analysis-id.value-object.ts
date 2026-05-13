import { ValueObject } from "@/modules/shared";

export class CVAnalysisId extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("CV analysis id is required");
  }

  static fromPrimitives(value: string): CVAnalysisId {
    return new CVAnalysisId(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
