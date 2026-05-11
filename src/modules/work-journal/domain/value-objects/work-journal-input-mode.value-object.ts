import { ValueObject } from "@/modules/shared";

export type EntryInputMode = "manual" | "ai_assisted";

export class WorkJournalInputMode extends ValueObject<EntryInputMode> {
  private constructor(private readonly value: EntryInputMode) {
    super();
  }

  static fromPrimitives(value: EntryInputMode): WorkJournalInputMode {
    if (value !== "manual" && value !== "ai_assisted") {
      throw new Error(`Invalid work journal input mode: ${value}`);
    }
    return new WorkJournalInputMode(value);
  }

  toPrimitives(): EntryInputMode {
    return this.value;
  }
}
