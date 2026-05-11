import { ValueObject } from "@/modules/shared";

export class WorkJournalNotes extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Work journal notes cannot be empty.");
  }

  static fromPrimitives(value: string): WorkJournalNotes {
    return new WorkJournalNotes(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
