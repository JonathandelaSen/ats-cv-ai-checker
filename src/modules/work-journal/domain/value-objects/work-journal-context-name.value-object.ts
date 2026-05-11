import { ValueObject } from "@/modules/shared";

export class WorkJournalContextName extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Work journal context name cannot be empty.");
  }

  static fromPrimitives(value: string): WorkJournalContextName {
    return new WorkJournalContextName(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
