import { ValueObject } from "./value-object";

export class UserId extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("UserId cannot be empty.");
  }

  static fromPrimitives(value: string): UserId {
    return new UserId(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
