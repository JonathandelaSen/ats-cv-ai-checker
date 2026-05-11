import { ValueObject } from "@/modules/shared";

export type ContextStatus = "active" | "archived";

export class WorkJournalContextStatus extends ValueObject<ContextStatus> {
  private constructor(private readonly value: ContextStatus) {
    super();
  }

  static fromPrimitives(value: ContextStatus): WorkJournalContextStatus {
    if (value !== "active" && value !== "archived") {
      throw new Error(`Invalid work journal context status: ${value}`);
    }
    return new WorkJournalContextStatus(value);
  }

  isActive(): boolean {
    return this.value === "active";
  }

  toPrimitives(): ContextStatus {
    return this.value;
  }
}
