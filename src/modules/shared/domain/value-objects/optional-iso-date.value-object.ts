import { ValueObject } from "./value-object";

export class OptionalIsoDate extends ValueObject<string | null> {
  protected constructor(private readonly value: string | null, label: string) {
    super();
    if (value !== null && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`Invalid ${label}: ${value}`);
    }
  }

  static fromPrimitives(value: string | null): OptionalIsoDate {
    return new OptionalIsoDate(value, "optional ISO date");
  }

  toPrimitives(): string | null {
    return this.value;
  }
}
