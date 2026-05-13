import { ValueObject } from "@/modules/shared";

export class CVDocumentId extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("CV document id is required");
  }

  static fromPrimitives(value: string): CVDocumentId {
    return new CVDocumentId(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
