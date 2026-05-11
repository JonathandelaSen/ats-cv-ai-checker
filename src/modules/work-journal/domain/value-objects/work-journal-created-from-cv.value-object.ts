import { ValueObject } from "@/modules/shared";

export class WorkJournalCreatedFromCv extends ValueObject<boolean> {
  private constructor(private readonly value: boolean) {
    super();
  }

  static fromPrimitives(value: boolean): WorkJournalCreatedFromCv {
    return new WorkJournalCreatedFromCv(value);
  }

  toPrimitives(): boolean {
    return this.value;
  }
}
