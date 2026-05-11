export abstract class ValueObject<TPrimitive> {
  abstract toPrimitives(): TPrimitive;

  equals(other: ValueObject<TPrimitive>): boolean {
    return Object.is(this.toPrimitives(), other.toPrimitives());
  }
}
