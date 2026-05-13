import { ValueObject } from "@/modules/shared";

export class AnalysisChatContent extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Analysis chat content cannot be empty.");
  }

  static fromPrimitives(value: string): AnalysisChatContent {
    return new AnalysisChatContent(value.trim());
  }

  toPrimitives(): string {
    return this.value;
  }
}
