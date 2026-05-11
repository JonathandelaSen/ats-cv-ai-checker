import { ValueObject } from "./value-object";

export class Timestamp extends ValueObject<string> {
  protected constructor(private readonly value: string, label: string) {
    super();
    if (!value.trim()) throw new Error(`${label} cannot be empty.`);
  }

  static fromPrimitives(value: string): Timestamp {
    return new Timestamp(value, "timestamp");
  }

  toPrimitives(): string {
    return this.value;
  }
}
