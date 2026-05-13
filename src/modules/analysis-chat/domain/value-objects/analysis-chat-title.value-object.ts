import { ValueObject } from "@/modules/shared";

export class AnalysisChatTitle extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Analysis chat title cannot be empty.");
  }

  static fromPrimitives(value: string): AnalysisChatTitle {
    return new AnalysisChatTitle(value.trim());
  }

  toPrimitives(): string {
    return this.value;
  }
}
