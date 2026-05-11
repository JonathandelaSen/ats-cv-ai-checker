import { ValueObject } from "@/modules/shared";

export type SuggestionSource = "cv";

export class WorkJournalSuggestionSource extends ValueObject<SuggestionSource> {
  private constructor(private readonly value: SuggestionSource) {
    super();
  }

  static fromPrimitives(value: SuggestionSource): WorkJournalSuggestionSource {
    if (value !== "cv") throw new Error(`Invalid suggestion source: ${value}`);
    return new WorkJournalSuggestionSource(value);
  }

  toPrimitives(): SuggestionSource {
    return this.value;
  }
}
