import { ValueObject } from "@/modules/shared";

export class ReceivedFeedbackText extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Received feedback text cannot be empty.");
    if (value.length > 10000) throw new Error("Received feedback text is too long.");
  }

  static fromPrimitives(value: string): ReceivedFeedbackText {
    return new ReceivedFeedbackText(value.trim());
  }

  toPrimitives(): string {
    return this.value;
  }
}
