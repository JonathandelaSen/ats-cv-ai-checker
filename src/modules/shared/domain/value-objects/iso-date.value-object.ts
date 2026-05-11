import { ValueObject } from "./value-object";

export class IsoDate extends ValueObject<string> {
  protected constructor(private readonly value: string, label: string) {
    super();
    if (!value.trim()) throw new Error(`${label} cannot be empty.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`Invalid ${label}: ${value}`);
    }
  }

  static fromPrimitives(value: string): IsoDate {
    return new IsoDate(value, "ISO date");
  }

  toPrimitives(): string {
    return this.value;
  }
}
