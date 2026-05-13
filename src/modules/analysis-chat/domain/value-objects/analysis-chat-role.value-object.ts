import { ValueObject } from "@/modules/shared";

export type AnalysisChatRolePrimitives = "user" | "assistant";

export class AnalysisChatRole extends ValueObject<AnalysisChatRolePrimitives> {
  private constructor(private readonly value: AnalysisChatRolePrimitives) {
    super();
  }

  static fromPrimitives(value: string): AnalysisChatRole {
    if (value !== "user" && value !== "assistant") {
      throw new Error("Analysis chat role must be user or assistant.");
    }

    return new AnalysisChatRole(value);
  }

  static user(): AnalysisChatRole {
    return new AnalysisChatRole("user");
  }

  static assistant(): AnalysisChatRole {
    return new AnalysisChatRole("assistant");
  }

  toPrimitives(): AnalysisChatRolePrimitives {
    return this.value;
  }
}
