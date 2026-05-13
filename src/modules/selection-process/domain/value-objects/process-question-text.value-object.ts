import { ValueObject } from "@/modules/shared";

export class ProcessQuestionText extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Process question text is required");
  }

  static fromPrimitives(value: string): ProcessQuestionText {
    return new ProcessQuestionText(value.trim());
  }

  toPrimitives(): string {
    return this.value;
  }
}
