import { ValueObject } from "@/modules/shared";

export class WorkJournalRoleOrLabel extends ValueObject<string | null> {
  private constructor(private readonly value: string | null) {
    super();
  }

  static fromPrimitives(value: string | null): WorkJournalRoleOrLabel {
    return new WorkJournalRoleOrLabel(value?.trim() || null);
  }

  toPrimitives(): string | null {
    return this.value;
  }
}
