import { ValueObject } from "@/modules/shared";

export class CVDocumentName extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("CV document name is required");
  }

  static fromPrimitives(value: string): CVDocumentName {
    return new CVDocumentName(value.trim());
  }

  toPrimitives(): string {
    return this.value;
  }
}
