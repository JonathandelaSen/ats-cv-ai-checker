import { EntityId } from "@/modules/shared";

export class AnalysisChatMessageId extends EntityId {
  private constructor(value: string) {
    super(value, "Analysis chat message id");
  }

  static fromPrimitives(value: string): AnalysisChatMessageId {
    return new AnalysisChatMessageId(value);
  }
}
