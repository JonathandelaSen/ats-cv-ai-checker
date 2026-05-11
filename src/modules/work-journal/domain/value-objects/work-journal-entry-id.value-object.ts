import { EntityId } from "@/modules/shared";

export class WorkJournalEntryId extends EntityId {
  private constructor(value: string) {
    super(value, "Work journal entry id");
  }

  static fromPrimitives(value: string): WorkJournalEntryId {
    return new WorkJournalEntryId(value);
  }
}
