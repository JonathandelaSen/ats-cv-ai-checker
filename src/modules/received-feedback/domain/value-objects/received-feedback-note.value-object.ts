import { ValueObject } from "@/modules/shared";

export class ReceivedFeedbackNote extends ValueObject<string | null> {
  private constructor(private readonly value: string | null) {
    super();
    if (value && value.length > 10000) throw new Error("Received feedback note is too long.");
  }

  static fromPrimitives(value: string | null | undefined): ReceivedFeedbackNote {
    if (typeof value !== "string") return new ReceivedFeedbackNote(null);
    const trimmed = value.trim();
    return new ReceivedFeedbackNote(trimmed ? trimmed : null);
  }

  toPrimitives(): string | null {
    return this.value;
  }
}
