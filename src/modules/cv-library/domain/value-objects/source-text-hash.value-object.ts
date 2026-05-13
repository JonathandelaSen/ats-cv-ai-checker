import { ValueObject } from "@/modules/shared";

export class SourceTextHash extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
  }

  static fromPrimitives(value: string): SourceTextHash {
    return new SourceTextHash(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
