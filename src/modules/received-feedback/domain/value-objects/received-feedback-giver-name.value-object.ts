import { ValueObject } from "@/modules/shared";

export class ReceivedFeedbackGiverName extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Received feedback giver name cannot be empty.");
    if (value.length > 120) throw new Error("Received feedback giver name is too long.");
  }

  static fromPrimitives(value: string): ReceivedFeedbackGiverName {
    return new ReceivedFeedbackGiverName(value.trim());
  }

  toPrimitives(): string {
    return this.value;
  }
}
