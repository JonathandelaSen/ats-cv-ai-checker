import { ValueObject } from "@/modules/shared";

export class WorkJournalIsDefault extends ValueObject<boolean> {
  private constructor(private readonly value: boolean) {
    super();
  }

  static fromPrimitives(value: boolean): WorkJournalIsDefault {
    return new WorkJournalIsDefault(value);
  }

  toPrimitives(): boolean {
    return this.value;
  }
}
