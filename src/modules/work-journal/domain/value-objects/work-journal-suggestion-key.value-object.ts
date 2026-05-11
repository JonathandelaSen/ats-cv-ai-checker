import { ValueObject } from "@/modules/shared";

export class WorkJournalSuggestionKey extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Work journal suggestion key cannot be empty.");
  }

  static fromPrimitives(value: string): WorkJournalSuggestionKey {
    return new WorkJournalSuggestionKey(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
