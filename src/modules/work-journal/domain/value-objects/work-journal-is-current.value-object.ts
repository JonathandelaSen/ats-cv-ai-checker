import { ValueObject } from "@/modules/shared";

export class WorkJournalIsCurrent extends ValueObject<boolean> {
  private constructor(private readonly value: boolean) {
    super();
  }

  static fromPrimitives(value: boolean): WorkJournalIsCurrent {
    return new WorkJournalIsCurrent(value);
  }

  toPrimitives(): boolean {
    return this.value;
  }
}
