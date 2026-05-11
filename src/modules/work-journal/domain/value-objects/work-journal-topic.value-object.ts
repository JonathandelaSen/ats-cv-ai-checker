import { ValueObject } from "@/modules/shared";

export class WorkJournalTopic extends ValueObject<string | null> {
  private constructor(private readonly value: string | null) {
    super();
  }

  static fromPrimitives(value: string | null): WorkJournalTopic {
    return new WorkJournalTopic(value?.trim() || null);
  }

  toPrimitives(): string | null {
    return this.value;
  }
}
