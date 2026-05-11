import { ValueObject } from "./value-object";

export class EntityId extends ValueObject<string> {
  protected constructor(private readonly value: string, label: string) {
    super();
    if (!value.trim()) throw new Error(`${label} cannot be empty.`);
  }

  static fromPrimitives(value: string): EntityId {
    return new EntityId(value, "Entity id");
  }

  toPrimitives(): string {
    return this.value;
  }
}
