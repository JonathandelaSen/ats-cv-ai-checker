import { ValueObject } from "@/modules/shared";

export class WorkJournalFinalText extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Work journal final text cannot be empty.");
  }

  static fromPrimitives(value: string): WorkJournalFinalText {
    return new WorkJournalFinalText(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
