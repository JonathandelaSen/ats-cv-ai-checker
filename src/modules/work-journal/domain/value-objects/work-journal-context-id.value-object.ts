import { EntityId } from "@/modules/shared";

export class WorkJournalContextId extends EntityId {
  private constructor(value: string) {
    super(value, "Work journal context id");
  }

  static fromPrimitives(value: string): WorkJournalContextId {
    return new WorkJournalContextId(value);
  }
}
