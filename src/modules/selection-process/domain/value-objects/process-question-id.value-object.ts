import { ValueObject } from "@/modules/shared";

export class ProcessQuestionId extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Process question id is required");
  }

  static fromPrimitives(value: string): ProcessQuestionId {
    return new ProcessQuestionId(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
