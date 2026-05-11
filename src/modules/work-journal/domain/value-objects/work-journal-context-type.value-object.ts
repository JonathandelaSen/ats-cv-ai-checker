import { ValueObject } from "@/modules/shared";

export type ContextType = "employment" | "project";

export class WorkJournalContextType extends ValueObject<ContextType> {
  private constructor(private readonly value: ContextType) {
    super();
  }

  static fromPrimitives(value: ContextType): WorkJournalContextType {
    if (value !== "employment" && value !== "project") {
      throw new Error(`Invalid work journal context type: ${value}`);
    }
    return new WorkJournalContextType(value);
  }

  toPrimitives(): ContextType {
    return this.value;
  }
}
