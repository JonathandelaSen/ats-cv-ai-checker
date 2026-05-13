import { ValueObject } from "@/modules/shared";

export class ProfileSchemaVersion extends ValueObject<string> {
  private constructor(private readonly value: string) {
    super();
    if (!value.trim()) throw new Error("Profile schema version is required");
  }

  static fromPrimitives(value: string): ProfileSchemaVersion {
    return new ProfileSchemaVersion(value);
  }

  toPrimitives(): string {
    return this.value;
  }
}
